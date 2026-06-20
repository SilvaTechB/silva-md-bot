'use strict';
const axios = require('axios');

// paxsenix.biz.id (ENOTFOUND) and siputzx.my.id (ENOTFOUND) removed.
// Replaced with ch.at (confirmed working 2026-06) + built-in extractive fallback.

module.exports = {
    commands: ['summarize', 'summary', 'tldr', 'shorten', 'brief'],
    description: 'AI summarizes any long text, article, or quoted message',
    usage:       '.summarize <text> OR reply to a long message',
    permission:  'public',
    group:       true,
    private:     true,

    run: async (sock, message, args, ctx) => {
        const { reply, safeSend } = ctx;

        const quoted = message.message?.extendedTextMessage?.contextInfo;
        const quotedText = quoted?.quotedMessage?.conversation
            || quoted?.quotedMessage?.extendedTextMessage?.text
            || '';

        const inputText = args.join(' ').trim() || quotedText;

        if (!inputText) {
            return reply(
                `📝 *Summarizer*\n\n` +
                `Reply to any long message with \`.summarize\` to get a quick summary.\n\n` +
                `Or provide text directly:\n` +
                `\`.summarize The quick brown fox jumps over...\`\n\n` +
                `_Aliases: .tldr  .brief  .shorten_`
            );
        }

        if (inputText.length < 100) {
            return reply(`⚠️ The text is too short to summarize (${inputText.length} chars). Provide a longer piece of text.`);
        }

        await safeSend({ text: `📝 _Summarizing..._` }, { quoted: message });

        const prompt = `Summarize the following text in clear, concise bullet points. Be brief but cover all key points:\n\n${inputText.slice(0, 4000)}`;

        // 1. Try Gemini (if key set)
        const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_KEY || '';
        if (apiKey) {
            try {
                const { GoogleGenerativeAI } = require('@google/generative-ai');
                const genAI = new GoogleGenerativeAI(apiKey);
                const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
                const result = await model.generateContent(prompt);
                const summary = result.response.text().trim();
                if (summary) return reply(`📝 *Summary*\n\n${summary}`);
            } catch { /* fall through */ }
        }

        // 2. Try ch.at (confirmed working 2026-06)
        try {
            const res = await axios.post('https://ch.at/api/chat',
                { message: prompt },
                { headers: { 'Content-Type': 'application/json', 'User-Agent': 'SilvaMD-Bot/2.0' }, timeout: 15000 }
            );
            const summary = res.data?.answer || res.data?.reply || res.data?.message || res.data?.response || res.data?.result;
            if (summary && String(summary).trim().length > 10) {
                return reply(`📝 *Summary*\n\n${String(summary).trim()}`);
            }
        } catch { /* fall through */ }

        // 3. Built-in extractive summarization — always works, no API
        const sentences = inputText
            .replace(/\s+/g, ' ')
            .split(/(?<=[.!?])\s+/)
            .filter(s => s.length > 20);

        const maxSentences = Math.min(5, Math.ceil(sentences.length * 0.3));
        const extracted = sentences.slice(0, maxSentences).join(' ');

        reply(
            `📝 *Summary* _(extracted)_\n\n${extracted}\n\n` +
            `_Original: ${inputText.length} chars → Summary: ${extracted.length} chars_`
        );
    },
};

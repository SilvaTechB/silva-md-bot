'use strict';
const axios = require('axios');

module.exports = {
    commands: ['summarize', 'summary', 'tldr', 'shorten', 'brief'],
    description: 'AI summarizes any long text, article, or quoted message',
    usage: '.summarize <text> OR reply to a long message',
    permission: 'public',
    group: true,
    private: true,

    run: async (sock, message, args, ctx) => {
        const { reply, safeSend } = ctx;

        // Accept direct text, quoted message text, or args
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

        const prompt = `Summarize the following text in clear, concise bullet points. Be brief but cover all key points:\n\n${inputText}`;

        // 1. Try Gemini
        const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_KEY || '';
        if (apiKey) {
            try {
                const { GoogleGenerativeAI } = require('@google/generative-ai');
                const genAI = new GoogleGenerativeAI(apiKey);
                const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
                const result = await model.generateContent(prompt);
                const summary = result.response.text().trim();
                return reply(`📝 *Summary*\n\n${summary}`);
            } catch { /* fall through */ }
        }

        // 2. Try free AI APIs
        const apis = [
            async () => {
                const res = await axios.get(`https://api.paxsenix.biz.id/ai/gpt4o?text=${encodeURIComponent(prompt)}`, { timeout: 15000 });
                return res.data?.message || res.data?.result;
            },
            async () => {
                const res = await axios.get(`https://api.siputzx.my.id/api/ai/deepseek-r1?content=${encodeURIComponent(prompt)}`, { timeout: 15000 });
                return res.data?.data;
            },
        ];

        for (const fn of apis) {
            try {
                const summary = await fn();
                if (summary) return reply(`📝 *Summary*\n\n${String(summary).trim()}`);
            } catch { /* next */ }
        }

        // 3. Built-in extractive summarization (no API)
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

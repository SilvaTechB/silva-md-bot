'use strict';

const axios = require('axios');
const { fmt } = require('../lib/theme');

// ── Dead as of 2026-06 (removed): siputzx (all endpoints), ryzendesu (bot-protected),
//    giftedtech (ENOTFOUND), lance-frank (dead), letmegpt (400), paxsenix (ENOTFOUND)
// ── Live: ch.at (~400ms), pollinations.ai text (~3-5s)

async function callChAt(prompt, retries = 3) {
    for (let i = 1; i <= retries; i++) {
        try {
            const res = await axios.post('https://ch.at/api/chat',
                { message: prompt },
                { headers: { 'Content-Type': 'application/json', 'User-Agent': 'SilvaMD-Bot/2.0' }, timeout: 12000 }
            );
            const t = res.data?.answer || res.data?.reply || res.data?.message || res.data?.response || res.data?.result;
            if (t && String(t).trim().length > 2) return String(t).trim();
        } catch {}
        if (i < retries) await new Promise(r => setTimeout(r, 500 * i));
    }
    return null;
}

async function callPollinations(prompt) {
    try {
        const res = await axios.get(
            'https://text.pollinations.ai/' + encodeURIComponent(prompt.slice(0, 500)) +
            '?model=openai&seed=' + (Date.now() % 9999),
            { timeout: 18000 }
        );
        return typeof res.data === 'string' ? res.data.trim() : null;
    } catch { return null; }
}

async function askAI(prompt) {
    let pollinationsTriggered = false;
    const pollinationsFallback = new Promise(resolve => {
        setTimeout(() => {
            pollinationsTriggered = true;
            callPollinations(prompt).then(resolve).catch(() => resolve(null));
        }, 200);
    });

    const result = await Promise.race([
        callChAt(prompt),
        pollinationsFallback,
        new Promise(resolve => setTimeout(() => resolve(null), 22000)),
    ]);
    return result || '⚠️ AI servers are busy right now. Please try again in a moment.';
}

function buildPlugin(cmds, label, systemHint) {
    return {
        commands:    cmds,
        description: `Ask ${label} a question`,
        usage:       `.${cmds[0]} <question>`,
        permission:  'public',
        group:       true,
        private:     true,

        run: async (sock, message, args, ctx) => {
            const { jid, contextInfo } = ctx;
            const query = args.join(' ').trim();
            if (!query) {
                return sock.sendMessage(jid, {
                    text: fmt(`❌ *Usage:* \`.${cmds[0]} <question>\`\n\nExample: \`.${cmds[0]} What is quantum computing?\``),
                    contextInfo
                }, { quoted: message });
            }
            await sock.sendPresenceUpdate('composing', jid);
            const prompt = systemHint ? `[${systemHint}] ${query}` : query;
            const answer = await askAI(prompt);
            await sock.sendMessage(jid, {
                text: fmt(`🤖 *${label}*\n\n❓ *Q:* ${query}\n\n💬 *A:* ${answer}`),
                contextInfo
            }, { quoted: message });
        }
    };
}

module.exports = [
    buildPlugin(['chatat', 'chat'],      'ch.at AI',      null),
    buildPlugin(['chatai'],               'Silva Chat AI', null),
    buildPlugin(['gemini', 'bard'],       'Gemini AI',     'Answer as a knowledgeable AI assistant'),
    buildPlugin(['giftedai'],             'Gifted AI',     'Be creative and helpful'),
    buildPlugin(['gpt4', 'gpt-4'],        'GPT-4',         'Provide a detailed expert answer'),
    buildPlugin(['gpt4o', 'gpt-4o'],      'GPT-4o',        'Provide a detailed expert answer'),
    buildPlugin(['gpt4o-mini'],           'GPT-4o Mini',   'Be concise and helpful'),
    buildPlugin(['openai'],               'OpenAI',        'Provide a detailed expert answer'),
    buildPlugin(['venice'],               'Venice AI',     'Be creative and insightful'),
    buildPlugin(['letmegpt'],             'LetMeGPT',      null),
];

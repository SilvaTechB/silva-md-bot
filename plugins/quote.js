'use strict';
const axios = require('axios');

module.exports = {
    commands:    ['quote', 'inspire', 'motivation'],
    description: 'Get a random inspirational quote',
    permission:  'public',
    group:       true,
    private:     true,

    run: async (sock, message, args, ctx) => {
        const { contextInfo } = ctx;
        const jid = message.key.remoteJid;
        try {
            const res = await axios.get('https://api.quotable.io/random', { timeout: 8000 });
            const { content, author, tags } = res.data;
            const tag = tags?.length ? `\n🏷️ _${tags.slice(0,3).join(', ')}_` : '';
            await sock.sendMessage(jid, {
                text: `💬 *Quote of the Moment*\n\n"${content}"\n\n— *${author}*${tag}\n\n> _Powered by Silva MD_`,
                contextInfo
            }, { quoted: message });
        } catch {
            const fallbacks = [
                { q: "The only way to do great work is to love what you do.", a: "Steve Jobs" },
                { q: "In the middle of every difficulty lies opportunity.", a: "Albert Einstein" },
                { q: "It does not matter how slowly you go as long as you do not stop.", a: "Confucius" },
                { q: "Life is what happens when you're busy making other plans.", a: "John Lennon" },
                { q: "The future belongs to those who believe in the beauty of their dreams.", a: "Eleanor Roosevelt" },
            ];
            const pick = fallbacks[Math.floor(Math.random() * fallbacks.length)];
            await sock.sendMessage(jid, {
                text: `💬 *Quote of the Moment*\n\n"${pick.q}"\n\n— *${pick.a}*\n\n> _Powered by Silva MD_`,
                contextInfo
            }, { quoted: message });
        }
    }
};

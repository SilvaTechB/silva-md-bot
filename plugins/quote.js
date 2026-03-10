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
        let content, author;
        try {
            const res = await axios.get('https://api.quotable.io/random', { timeout: 8000 });
            content = res.data.content;
            author  = res.data.author;
        } catch {
            const fallbacks = [
                { q: "The only way to do great work is to love what you do.", a: "Steve Jobs" },
                { q: "In the middle of every difficulty lies opportunity.", a: "Albert Einstein" },
                { q: "It does not matter how slowly you go as long as you do not stop.", a: "Confucius" },
            ];
            const pick = fallbacks[Math.floor(Math.random() * fallbacks.length)];
            content = pick.q; author = pick.a;
        }
        await sock.sendMessage(jid, {
            text: `💬 *Quote of the Moment*\n\n"${content}"\n\n— *${author}*`,
            contextInfo
        }, { quoted: message });
    }
};

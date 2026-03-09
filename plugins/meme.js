'use strict';
const axios = require('axios');

module.exports = {
    commands:    ['meme', 'memes'],
    description: 'Get a random meme image',
    usage:       '.meme [subreddit]  e.g. .meme dankmemes',
    permission:  'public',
    group:       true,
    private:     true,

    run: async (sock, message, args, ctx) => {
        const { contextInfo } = ctx;
        const jid = message.key.remoteJid;
        const sub = args[0] || 'memes';
        try {
            const res = await axios.get(`https://meme-api.com/gimme/${encodeURIComponent(sub)}`, { timeout: 10000 });
            const { title, url, author, subreddit, ups } = res.data;
            if (!url) throw new Error('No meme URL');
            await sock.sendMessage(jid, {
                image:   { url },
                caption: `😂 *${title}*\n\n👤 u/${author}  •  r/${subreddit}  •  👍 ${ups?.toLocaleString() || '?'}\n\n> _Powered by Silva MD_`,
                contextInfo
            }, { quoted: message });
        } catch (err) {
            await sock.sendMessage(jid, {
                text: `❌ Couldn't fetch a meme: ${err.message}\n\nTry: \`.meme\` or \`.meme dankmemes\``,
                contextInfo
            }, { quoted: message });
        }
    }
};

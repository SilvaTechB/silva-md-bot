const axios = require('axios');

module.exports = {
    commands: ['quote'],
    handler: async ({ sock, m, sender, args, contextInfo }) => {
        const text = args.join(' ') || 'Silva MD Bot Rocks!';
        const imgURL = `https://api.popcat.xyz/quote?text=${encodeURIComponent(text)}&author=SilvaTech`;
        await sock.sendMessage(sender, {
            image: { url: imgURL },
            caption: `✨ Your Quote:\n${text}`,
            contextInfo
        }, { quoted: m });
    }
};
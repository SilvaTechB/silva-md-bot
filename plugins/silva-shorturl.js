const axios = require('axios');

module.exports = {
    commands: ['shorten'],
    handler: async ({ sock, m, sender, args, contextInfo }) => {
        if (!args[0]) {
            return sock.sendMessage(sender, { text: '❌ Usage: .shorten <url>', contextInfo }, { quoted: m });
        }
        try {
            const res = await axios.get(`https://tinyurl.com/api-create.php?url=${args[0]}`);
            await sock.sendMessage(sender, { text: `✅ Shortened URL:\n${res.data}`, contextInfo }, { quoted: m });
        } catch {
            await sock.sendMessage(sender, { text: '❌ Failed to shorten URL.', contextInfo }, { quoted: m });
        }
    }
};
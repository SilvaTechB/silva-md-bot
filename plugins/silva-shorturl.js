'use strict';

const axios = require('axios');


module.exports = {
    commands:    ['shorten'],
    description: 'Shorten a URL using TinyURL',
    permission:  'public',
    group:       true,
    private:     true,
    run: async (sock, message, args, { sender, contextInfo }) => {
        if (!args[0]) {
            return sock.sendMessage(sender, {
                text: '❌ Usage: .shorten <url>',
                contextInfo
            }, { quoted: message });
        }
        try {
            const res = await axios.get(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(args[0])}`);
            await sock.sendMessage(sender, {
                text: `🔗 *Shortened URL*\n\n${res.data}`,
                contextInfo
            }, { quoted: message });
        } catch {
            await sock.sendMessage(sender, {
                text: '❌ Failed to shorten URL.',
                contextInfo
            }, { quoted: message });
        }
    }
};

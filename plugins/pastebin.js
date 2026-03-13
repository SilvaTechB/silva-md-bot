'use strict';
const axios = require('axios');

module.exports = {
    commands:    ['paste', 'pastebin', 'hastebin'],
    description: 'Paste text online and get a shareable link',
    permission:  'public',
    group:       true,
    private:     true,
    run: async (sock, message, args, { sender, contextInfo }) => {
        const text = args.join(' ');
        if (!text) {
            return sock.sendMessage(sender, {
                text: '📋 Please provide text to paste.\nExample: .paste Hello World\n_Or reply to a message with .paste_',
                contextInfo
            }, { quoted: message });
        }
        await sock.sendMessage(sender, { text: '⏳ Uploading to Hastebin...', contextInfo }, { quoted: message });
        try {
            const { data } = await axios.post('https://hastebin.com/documents', text, {
                headers: { 'Content-Type': 'text/plain' },
                timeout: 15000
            });
            if (!data?.key) throw new Error('No key returned');
            const link = `https://hastebin.com/${data.key}`;
            await sock.sendMessage(sender, {
                text: `📋 *Paste Uploaded!*\n\n🔗 ${link}\n\n_Expires in 30 days • Powered by Silva MD_`,
                contextInfo
            }, { quoted: message });
        } catch (e) {
            await sock.sendMessage(sender, { text: `❌ Paste failed: ${e.message}`, contextInfo }, { quoted: message });
        }
    }
};

'use strict';
const axios = require('axios');

module.exports = {
    commands:    ['carbon', 'codeimg', 'code2img'],
    description: 'Convert code to a beautiful image via Carbon',
    permission:  'public',
    group:       true,
    private:     true,
    run: async (sock, message, args, { sender, groupId, contextInfo }) => {
        const chatId = groupId || sender;
        const code   = args.join(' ');
        if (!code) {
            return sock.sendMessage(chatId, {
                text: '💻 Usage: .carbon <code>\nExample: .carbon console.log("Hello World")',
                contextInfo
            }, { quoted: message });
        }
        await sock.sendMessage(chatId, { text: '⏳ Generating code image...', contextInfo }, { quoted: message });
        try {
            const api = `https://api.nexoracle.com/tools/carbon?code=${encodeURIComponent(code)}&apikey=free_for_use`;
            const { data } = await axios.get(api, { responseType: 'arraybuffer', timeout: 20000 });
            await sock.sendMessage(chatId, {
                image:   Buffer.from(data),
                caption: `💻 *Code Image*\n_Powered by Silva MD_`,
                contextInfo
            }, { quoted: message });
        } catch {
            const encodedUrl = `https://carbon.now.sh/?bg=rgba%28171%2C+184%2C+195%2C+1%29&t=monokai&wt=none&l=auto&code=${encodeURIComponent(code)}`;
            await sock.sendMessage(chatId, {
                text: `💻 *Code Image*\nOpen this link to generate your code image:\n${encodedUrl}\n\n_Powered by Silva MD_`,
                contextInfo
            }, { quoted: message });
        }
    }
};

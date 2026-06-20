'use strict';
const axios = require('axios');

// nexoracle.com removed (dead 2026-06, returns bot-protection HTML).
// Using thum.io to screenshot carbon.now.sh as a real PNG image.

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
                text: '💻 Usage: `.carbon <code>`\nExample: `.carbon console.log("Hello World")`',
                contextInfo
            }, { quoted: message });
        }
        await sock.sendMessage(chatId, { text: '⏳ Generating code image...', contextInfo }, { quoted: message });

        const carbonUrl = `https://carbon.now.sh/?bg=rgba%28171%2C184%2C195%2C1%29&t=monokai&wt=none&l=auto&code=${encodeURIComponent(code)}`;

        // Use thum.io to screenshot the carbon.now.sh page as PNG
        try {
            const screenshotUrl = `https://image.thum.io/get/width/1200/crop/700/${carbonUrl}`;
            const res = await axios.get(screenshotUrl, {
                responseType: 'arraybuffer',
                timeout: 30000,
                headers: { 'User-Agent': 'Mozilla/5.0' }
            });
            if (res.data?.length > 5000) {
                return sock.sendMessage(chatId, {
                    image:   Buffer.from(res.data),
                    caption: `💻 *Code Image*\n_Powered by Silva MD_`,
                    contextInfo
                }, { quoted: message });
            }
        } catch {}

        // Fallback: send the carbon.now.sh link
        await sock.sendMessage(chatId, {
            text: `💻 *Code Image*\n\nOpen this link to view your code image:\n${carbonUrl}\n\n_Powered by Silva MD_`,
            contextInfo
        }, { quoted: message });
    }
};

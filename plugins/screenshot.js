'use strict';
const axios = require('axios');

module.exports = {
    commands:    ['screenshot', 'ss', 'webshot'],
    description: 'Take a screenshot of any website',
    permission:  'public',
    group:       true,
    private:     true,
    run: async (sock, message, args, { sender, contextInfo }) => {
        let url = args[0];
        if (!url) {
            return sock.sendMessage(sender, {
                text: '🌐 Please provide a URL.\nExample: .ss https://google.com',
                contextInfo
            }, { quoted: message });
        }
        if (!/^https?:\/\//.test(url)) url = 'https://' + url;
        await sock.sendMessage(sender, { text: '⏳ Taking screenshot...', contextInfo }, { quoted: message });
        try {
            const ssUrl = `https://image.thum.io/get/width/1280/crop/720/png/${url}`;
            const { data } = await axios.get(ssUrl, { responseType: 'arraybuffer', timeout: 30000 });
            await sock.sendMessage(sender, {
                image:   Buffer.from(data),
                caption: `📸 *Screenshot:* ${url}\n_Powered by Silva MD_`,
                contextInfo
            }, { quoted: message });
        } catch (e) {
            await sock.sendMessage(sender, { text: `❌ Screenshot failed: ${e.message}`, contextInfo }, { quoted: message });
        }
    }
};

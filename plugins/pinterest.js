'use strict';
const axios = require('axios');

module.exports = {
    commands:    ['pinterest', 'pin', 'pindl'],
    description: 'Download Pinterest images and videos',
    permission:  'public',
    group:       true,
    private:     true,
    run: async (sock, message, args, { sender, contextInfo }) => {
        const url = args[0];
        if (!url || !url.includes('pinterest')) {
            return sock.sendMessage(sender, {
                text: '❌ Please provide a valid Pinterest URL.\nExample: .pin https://pinterest.com/pin/123',
                contextInfo
            }, { quoted: message });
        }
        await sock.sendMessage(sender, { text: '⏳ Fetching Pinterest media...', contextInfo }, { quoted: message });
        try {
            const api = `https://api.nexoracle.com/downloaders/pinterest?url=${encodeURIComponent(url)}&apikey=free_for_use`;
            const { data } = await axios.get(api, { timeout: 20000, headers: { 'User-Agent': 'Mozilla/5.0' } });
            const mediaUrl = data?.result?.url || data?.result?.media || data?.data?.url;
            if (!mediaUrl) throw new Error('No media found.');
            const isVideo = /\.mp4/.test(mediaUrl);
            await sock.sendMessage(sender, {
                [isVideo ? 'video' : 'image']: { url: mediaUrl },
                caption: '📌 *Pinterest Download*\n_Powered by Silva MD_',
                contextInfo
            }, { quoted: message });
        } catch (e) {
            await sock.sendMessage(sender, { text: `❌ Pinterest download failed: ${e.message}`, contextInfo }, { quoted: message });
        }
    }
};

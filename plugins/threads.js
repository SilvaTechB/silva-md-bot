'use strict';
const axios = require('axios');

module.exports = {
    commands:    ['threads', 'threadsdl'],
    description: 'Download Threads videos and images',
    permission:  'public',
    group:       true,
    private:     true,
    run: async (sock, message, args, { sender, contextInfo }) => {
        const url = args[0];
        if (!url || !url.includes('threads.net')) {
            return sock.sendMessage(sender, {
                text: '❌ Please provide a valid Threads URL.\nExample: .threads https://www.threads.net/@user/post/abc',
                contextInfo
            }, { quoted: message });
        }
        await sock.sendMessage(sender, { text: '⏳ Fetching Threads media...', contextInfo }, { quoted: message });
        try {
            const api = `https://api.nexoracle.com/downloaders/threads?url=${encodeURIComponent(url)}&apikey=free_for_use`;
            const { data } = await axios.get(api, { timeout: 25000, headers: { 'User-Agent': 'Mozilla/5.0' } });
            const result   = data?.result || data?.data;
            const mediaUrl = result?.video || result?.image || result?.url;
            if (!mediaUrl) throw new Error('No media found.');
            const isVideo  = result?.video || /\.mp4/.test(mediaUrl);
            await sock.sendMessage(sender, {
                [isVideo ? 'video' : 'image']: { url: mediaUrl },
                caption: `🧵 *Threads Download*\n_Powered by Silva MD_`,
                contextInfo
            }, { quoted: message });
        } catch (e) {
            await sock.sendMessage(sender, { text: `❌ Threads download failed: ${e.message}`, contextInfo }, { quoted: message });
        }
    }
};

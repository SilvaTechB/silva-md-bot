'use strict';
const axios = require('axios');

module.exports = {
    commands:    ['twitter', 'xdl', 'twdl', 'tw'],
    description: 'Download Twitter/X videos',
    permission:  'public',
    group:       true,
    private:     true,
    run: async (sock, message, args, { sender, contextInfo }) => {
        const url = args[0];
        if (!url || !/twitter\.com|x\.com|t\.co/.test(url)) {
            return sock.sendMessage(sender, {
                text: '❌ Please provide a valid Twitter/X URL.\nExample: .tw https://twitter.com/user/status/123',
                contextInfo
            }, { quoted: message });
        }
        await sock.sendMessage(sender, { text: '⏳ Fetching Twitter media...', contextInfo }, { quoted: message });
        try {
            const api = `https://api.nexoracle.com/downloaders/twitter?url=${encodeURIComponent(url)}&apikey=free_for_use`;
            const { data } = await axios.get(api, { timeout: 25000, headers: { 'User-Agent': 'Mozilla/5.0' } });
            const media = data?.result || data?.medias || data?.data;
            if (!media) throw new Error('No media found. The tweet may be private or text-only.');
            const item = Array.isArray(media) ? media[0] : media;
            const mediaUrl = item?.url || item?.video_url || item?.hd || item?.sd;
            if (!mediaUrl) throw new Error('Could not extract media URL.');
            const isVideo = /\.mp4|video/.test(mediaUrl);
            await sock.sendMessage(sender, {
                [isVideo ? 'video' : 'image']: { url: mediaUrl },
                caption: `🐦 *Twitter Download*\n_Powered by Silva MD_`,
                contextInfo
            }, { quoted: message });
        } catch (e) {
            await sock.sendMessage(sender, { text: `❌ Twitter download failed: ${e.message}`, contextInfo }, { quoted: message });
        }
    }
};

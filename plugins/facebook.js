'use strict';

const axios = require('axios');

module.exports = {
    commands:    ['facebook', 'fb', 'fbdl'],
    description: 'Download a Facebook video',
    permission:  'public',
    group:       true,
    private:     true,
    run: async (sock, message, args, { sender, prefix, command, contextInfo }) => {
        const url = args[0];
        if (!url) {
            return sock.sendMessage(sender, {
                text: `✳️ Please send a Facebook video link.\n\nExample: ${prefix}fb https://www.facebook.com/...`,
                contextInfo
            }, { quoted: message });
        }

        const urlRegex = /^(?:https?:\/\/)?(?:www\.)?(?:facebook\.com|fb\.watch|m\.facebook\.com)\b/i;
        if (!urlRegex.test(url)) {
            return sock.sendMessage(sender, {
                text: '⚠️ Please provide a valid Facebook URL.',
                contextInfo
            }, { quoted: message });
        }

        await sock.sendMessage(sender, { text: '📥 Downloading Facebook video...', contextInfo }, { quoted: message });

        try {
            const apiUrl  = `https://api.nexoracle.com/downloaders/fbdl?url=${encodeURIComponent(url)}&apikey=free_for_use`;
            const { data } = await axios.get(apiUrl, {
                timeout: 30000,
                headers: { 'User-Agent': 'Mozilla/5.0' }
            });

            const videoUrl = data?.result?.hd || data?.result?.sd || data?.link;
            if (!videoUrl) throw new Error('Could not extract video URL. The link may be private or unsupported.');

            const title = data?.result?.title || 'Facebook Video';

            await sock.sendMessage(sender, {
                video:   { url: videoUrl },
                caption: `🦋 *Facebook Video Downloaded*\n\n📌 *Title:* ${title}\n\n_Powered by Silva MD_`,
                contextInfo: {
                    ...contextInfo,
                    externalAdReply: {
                        title:               'Facebook Downloader',
                        body:                'Powered by Silva MD',
                        thumbnailUrl:        'https://files.catbox.moe/5uli5p.jpeg',
                        sourceUrl:           url,
                        mediaType:           1,
                        renderLargerThumbnail: true
                    }
                }
            }, { quoted: message });
        } catch (err) {
            console.error('[Facebook]', err.message);
            await sock.sendMessage(sender, {
                text: `❌ Facebook download failed: ${err.message}`,
                contextInfo
            }, { quoted: message });
        }
    }
};

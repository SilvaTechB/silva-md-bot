'use strict';

const axios    = require('axios');
const { getStr } = require('../lib/theme');

module.exports = {
    commands:    ['instagram', 'igdl', 'ig', 'insta'],
    description: 'Download Instagram posts, reels, and stories',
    permission:  'public',
    group:       true,
    private:     true,
    run: async (sock, message, args, { sender, prefix, contextInfo }) => {
        const url = args[0];
        if (!url || !url.includes('instagram.com')) {
            return sock.sendMessage(sender, {
                text: `📸 Please provide a valid Instagram URL.\nExample: ${prefix}ig https://www.instagram.com/p/xyz/`,
                contextInfo
            }, { quoted: message });
        }

        const loading = await sock.sendMessage(sender, {
            text: '⏳ Fetching Instagram content...',
            contextInfo: {
                ...contextInfo,
                externalAdReply: {
                    title:        'Instagram Downloader',
                    body:         'Processing your request',
                    thumbnailUrl: 'https://files.catbox.moe/5uli5p.jpeg',
                    mediaType:    1
                }
            }
        }, { quoted: message });

        try {
            const apiUrl  = `https://api.nexoracle.com/downloaders/igdl?url=${encodeURIComponent(url)}&apikey=free_for_use`;
            const { data } = await axios.get(apiUrl, {
                timeout: 30000,
                headers: { 'User-Agent': 'Mozilla/5.0' }
            });

            const items = data?.result || data?.media || [];
            if (!items.length) throw new Error('No media found — the post may be private or deleted.');

            if (loading) await sock.sendMessage(sender, { delete: loading.key }).catch(() => {});

            const slice = items.slice(0, 5);
            for (let i = 0; i < slice.length; i++) {
                const item     = slice[i];
                const mediaUrl = item.url || item.video_url || item.image_url;
                if (!mediaUrl) continue;
                const isVideo  = item.type === 'video' || mediaUrl.includes('.mp4');

                await sock.sendMessage(sender, {
                    [isVideo ? 'video' : 'image']: { url: mediaUrl },
                    caption: i === 0
                        ? '📸 *Instagram Download*\n' + (items.length > 1 ? `_(1 of ${items.length} items)_\n` : '') + `\n_Powered by ${getStr('botName') || 'Silva MD'}_`
                        : `_(${i + 1} of ${items.length})_`,
                    contextInfo: {
                        ...contextInfo,
                        externalAdReply: {
                            title:               'Instagram',
                            body:                'Powered by ' + (getStr('botName') || 'Silva MD'),
                            thumbnailUrl:        'https://files.catbox.moe/5uli5p.jpeg',
                            sourceUrl:           url,
                            mediaType:           1,
                            renderLargerThumbnail: true
                        }
                    }
                }, { quoted: message });
            }
        } catch (err) {
            console.error('[Instagram]', err.message);
            if (loading) await sock.sendMessage(sender, { delete: loading.key }).catch(() => {});
            await sock.sendMessage(sender, {
                text: `❌ Instagram download failed: ${err.message}`,
                contextInfo
            }, { quoted: message });
        }
    }
};

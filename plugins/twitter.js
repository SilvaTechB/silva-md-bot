'use strict';

const axios = require('axios');

// nexoracle.com returns bot-protection HTML, not API data — removed.
// Using vxtwitter (fxtwitter) API as primary: https://api.vxtwitter.com/{user}/status/{id}
// Fallback: provide direct link to the tweet for manual download.

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
                text: '❌ Please provide a valid Twitter/X URL.\nExample: `.tw https://twitter.com/user/status/123`',
                contextInfo
            }, { quoted: message });
        }

        await sock.sendMessage(sender, { text: '⏳ Fetching Twitter media...', contextInfo }, { quoted: message });

        // Extract username + tweet ID from URL
        const match = url.match(/(?:twitter\.com|x\.com)\/([^/?#]+)\/status\/(\d+)/);
        if (!match) {
            return sock.sendMessage(sender, {
                text: `❌ Could not parse tweet URL.\n\n🔗 Open manually: ${url}`,
                contextInfo
            }, { quoted: message });
        }
        const [, username, tweetId] = match;

        const strategies = [
            // Strategy 1: vxtwitter public API
            async () => {
                const res = await axios.get(
                    `https://api.vxtwitter.com/${username}/status/${tweetId}`,
                    { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 12000 }
                );
                const d = res.data;
                const media = d?.media_extended || d?.mediaURLs?.map(u => ({ url: u }));
                if (!media?.length) throw new Error('no media');
                return media.map(m => ({
                    url:  m.url || m.video_url,
                    type: (m.type === 'video' || (m.url || '').includes('.mp4')) ? 'video' : 'image',
                })).filter(m => m.url);
            },

            // Strategy 2: fxtwitter (alias of vxtwitter)
            async () => {
                const res = await axios.get(
                    `https://api.fxtwitter.com/${username}/status/${tweetId}`,
                    { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 12000 }
                );
                const tweet = res.data?.tweet;
                const media = tweet?.media?.all || tweet?.media?.videos || tweet?.media?.images;
                if (!media?.length) throw new Error('no media');
                return media.map(m => ({
                    url:  m.url || m.thumbnail_url,
                    type: (m.type === 'video') ? 'video' : 'image',
                })).filter(m => m.url);
            },
        ];

        let items = null;
        let lastErr = 'No media found';

        for (const strat of strategies) {
            try {
                const result = await strat();
                if (result?.length && result[0]?.url) { items = result; break; }
            } catch (e) {
                lastErr = String(e.message).slice(0, 80);
            }
        }

        if (!items?.length) {
            return sock.sendMessage(sender, {
                text:
                    `❌ *Twitter download failed*\n\n` +
                    `_${lastErr}_\n\n` +
                    `The video may be restricted or require login.\n` +
                    `🔗 Try: https://twittervideodownloader.com\n` +
                    `🔗 Or: https://twitsave.com`,
                contextInfo
            }, { quoted: message });
        }

        for (const item of items.slice(0, 3)) {
            const isVideo = item.type === 'video';
            try {
                await sock.sendMessage(sender, {
                    [isVideo ? 'video' : 'image']: { url: item.url },
                    caption: `🐦 *Twitter Download*\n_Powered by Silva MD_`,
                    contextInfo
                }, { quoted: message });
            } catch {
                if (isVideo) {
                    await sock.sendMessage(sender, {
                        document: { url: item.url },
                        mimetype: 'video/mp4',
                        fileName: `twitter_${tweetId}.mp4`,
                        contextInfo
                    }, { quoted: message }).catch(() => {});
                }
            }
        }
    }
};

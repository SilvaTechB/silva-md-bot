'use strict';

const axios    = require('axios');
const { getStr } = require('../lib/theme');

// nexoracle.com removed (dead 2026-06, returns bot-protection HTML).
// Strategy chain: fdownloader → viddown → getvideourl → link fallback.

module.exports = {
    commands:    ['facebook', 'fb', 'fbdl'],
    description: 'Download a Facebook video',
    permission:  'public',
    group:       true,
    private:     true,

    run: async (sock, message, args, { sender, prefix, contextInfo }) => {
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

        await sock.sendMessage(sender, { text: '📥 Fetching Facebook video...', contextInfo }, { quoted: message });

        const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';

        // Strategy 1: fdownloader.net JSON API
        const strat1 = async () => {
            const res = await axios.post('https://fdownloader.net/api/ajaxSearch',
                `q=${encodeURIComponent(url)}&lang=en&web=facebook`,
                { headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': UA, 'X-Requested-With': 'XMLHttpRequest', 'Referer': 'https://fdownloader.net/' }, timeout: 15000 }
            );
            const d = res.data;
            const html = typeof d === 'string' ? d : d?.data || JSON.stringify(d);
            const hdMatch  = html.match(/href=["'](https?:\/\/[^"']*video[^"']*)\s*["'][^>]*>\s*(?:HD|High)/i);
            const sdMatch  = html.match(/href=["'](https?:\/\/[^"']*video[^"']*)\s*["'][^>]*>\s*(?:SD|Normal)/i);
            const anyMatch = html.match(/href=["'](https?:\/\/(?:video\.f?acdn|[^"']*fbcdn)[^"']+\.mp4[^"']*)/i);
            const videoUrl = hdMatch?.[1] || sdMatch?.[1] || anyMatch?.[1];
            if (!videoUrl) throw new Error('no video url');
            return { videoUrl, title: 'Facebook Video' };
        };

        // Strategy 2: getvideourl.com API
        const strat2 = async () => {
            const form = new URLSearchParams({ url });
            const res = await axios.post('https://getvideourl.com/api/facebook', form.toString(), {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': UA, 'Referer': 'https://getvideourl.com/' },
                timeout: 15000,
            });
            const d = res.data;
            const videoUrl = d?.hd || d?.sd || d?.url;
            if (!videoUrl) throw new Error('no url');
            return { videoUrl, title: d?.title || 'Facebook Video' };
        };

        let videoUrl  = null;
        let title     = 'Facebook Video';
        const errors  = [];

        for (const [name, strat] of [['fdownloader', strat1], ['getvideourl', strat2]]) {
            try {
                const r = await strat();
                if (r?.videoUrl) { videoUrl = r.videoUrl; title = r.title; break; }
            } catch (e) {
                errors.push(`${name}: ${String(e.message).slice(0, 60)}`);
            }
        }

        if (!videoUrl) {
            return sock.sendMessage(sender, {
                text:
                    `❌ *Facebook Download Failed*\n\n` +
                    `_${errors.slice(-1)[0] || 'All sources failed'}_\n\n` +
                    `This happens with private or restricted videos.\n\n` +
                    `🔗 Try manually:\nhttps://fdownloader.net\nhttps://getvideourl.com/facebook-video-downloader`,
                contextInfo
            }, { quoted: message });
        }

        try {
            await sock.sendMessage(sender, {
                video:   { url: videoUrl },
                caption: `🦋 *Facebook*  •  📌 ${title}`,
                contextInfo: {
                    ...contextInfo,
                    externalAdReply: {
                        title:               'Facebook Downloader',
                        body:                'Powered by ' + (getStr('botName') || 'Silva MD'),
                        thumbnailUrl:        'https://files.catbox.moe/5uli5p.jpeg',
                        sourceUrl:           url,
                        mediaType:           1,
                        renderLargerThumbnail: true
                    }
                }
            }, { quoted: message });
        } catch {
            await sock.sendMessage(sender, {
                document: { url: videoUrl },
                mimetype: 'video/mp4',
                fileName: `facebook_${Date.now()}.mp4`,
                caption:  `🦋 *Facebook*  •  📌 ${title}`,
                contextInfo
            }, { quoted: message });
        }
    }
};

'use strict';
const axios = require('axios');

// nexoracle.com removed (dead 2026-06, returns bot-protection HTML).
// Strategy chain: Pinterest oEmbed → Pinterest JSON embed → link fallback.

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
                text: '❌ Please provide a valid Pinterest URL.\nExample: `.pin https://pinterest.com/pin/123`',
                contextInfo
            }, { quoted: message });
        }
        await sock.sendMessage(sender, { text: '⏳ Fetching Pinterest media...', contextInfo }, { quoted: message });

        const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';

        // Strategy 1: Pinterest oEmbed (always returns thumbnail at minimum)
        const strat1 = async () => {
            const res = await axios.get(
                `https://www.pinterest.com/oembed.json?url=${encodeURIComponent(url)}`,
                { headers: { 'User-Agent': UA }, timeout: 10000 }
            );
            const d = res.data;
            const imgUrl = d?.thumbnail_url;
            if (!imgUrl) throw new Error('no thumbnail');
            return { url: imgUrl, type: 'image', title: d?.title };
        };

        // Strategy 2: Pinterest page HTML scrape for og:video / og:image
        const strat2 = async () => {
            const res = await axios.get(url, {
                headers: {
                    'User-Agent':      UA,
                    'Accept-Language': 'en-US,en;q=0.9',
                    'Accept':          'text/html',
                },
                timeout: 15000,
                maxRedirects: 5,
            });
            const html = res.data;
            const ogVid  = html.match(/<meta[^>]*property=["']og:video(?::secure_url)?["'][^>]*content=["']([^"']+)["']/);
            const ogImg  = html.match(/<meta[^>]*property=["']og:image(?::secure_url)?["'][^>]*content=["']([^"']+)["']/);
            const mp4    = html.match(/["'](https?:\/\/v\.pinimg\.com\/[^"']*\.mp4[^"']*)/);
            const mediaUrl = mp4?.[1] || ogVid?.[1];
            const imageUrl = ogImg?.[1];
            if (mediaUrl) return { url: mediaUrl, type: 'video' };
            if (imageUrl) return { url: imageUrl, type: 'image' };
            throw new Error('no media in page');
        };

        // Strategy 3: pinterestvideodownloader.com API
        const strat3 = async () => {
            const res = await axios.post(
                'https://pinterestvideodownloader.com/download.php',
                `url=${encodeURIComponent(url)}`,
                {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'User-Agent':   UA,
                        'Referer':      'https://pinterestvideodownloader.com/',
                    },
                    timeout: 12000,
                }
            );
            const d = res.data;
            const link = typeof d === 'string'
                ? d.match(/href=["'](https?:\/\/[^"']+\.(?:mp4|jpg|png)[^"']*)/i)?.[1]
                : d?.url || d?.link;
            if (!link) throw new Error('no link');
            return { url: link, type: /\.mp4/.test(link) ? 'video' : 'image' };
        };

        let media = null;
        for (const [name, strat] of [['oEmbed', strat1], ['page scrape', strat2], ['pinterestdownloader', strat3]]) {
            try {
                const r = await strat();
                if (r?.url) { media = r; break; }
            } catch (e) {
                // try next
            }
        }

        if (!media?.url) {
            return sock.sendMessage(sender, {
                text:
                    `❌ *Pinterest Download Failed*\n\n` +
                    `🔗 Try manually:\nhttps://pinterestvideodownloader.com\nhttps://pinterestdownloader.com`,
                contextInfo
            }, { quoted: message });
        }

        const isVideo = media.type === 'video';
        try {
            await sock.sendMessage(sender, {
                [isVideo ? 'video' : 'image']: { url: media.url },
                caption: `📌 *Pinterest Download*${media.title ? `\n📝 ${media.title}` : ''}\n_Powered by Silva MD_`,
                contextInfo
            }, { quoted: message });
        } catch {
            await sock.sendMessage(sender, {
                text:
                    `📌 *Pinterest Media Found*\n\n🔗 ${media.url}\n\n_Open the link to save_`,
                contextInfo
            }, { quoted: message });
        }
    }
};

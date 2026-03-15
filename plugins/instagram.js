'use strict';

const axios    = require('axios');
const { fmt, getStr } = require('../lib/theme');

// ─── Helper: extract shortcode from any Instagram URL ───────────────────────
function extractShortcode(url) {
    const m = url.match(/instagram\.com\/(?:p|reel|tv|stories\/[^/]+)\/([A-Za-z0-9_-]+)/);
    return m?.[1] || null;
}

// ─── Helper: convert shortcode → media ID ───────────────────────────────────
function shortcodeToId(code) {
    const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
    let id = BigInt(0);
    for (const ch of code) id = id * BigInt(64) + BigInt(ALPHABET.indexOf(ch));
    return id.toString();
}

// ─── Strategy 1: Instagram oEmbed (public, reliable for image posts) ─────────
async function tryOEmbed(url) {
    const { data } = await axios.get(
        `https://api.instagram.com/oembed/?url=${encodeURIComponent(url)}&maxwidth=640`,
        { timeout: 10000, headers: { 'User-Agent': 'Mozilla/5.0' } }
    );
    if (!data?.thumbnail_url) throw new Error('No thumbnail');
    return [{
        url:     data.thumbnail_url,
        type:    'image',
        caption: data.title || '',
        author:  data.author_name || '',
    }];
}

// ─── Strategy 2: Instagram embed page — extract media from EmbedSimple JS ────
async function tryEmbedPage(url) {
    const shortcode = extractShortcode(url);
    if (!shortcode) throw new Error('Cannot parse shortcode');

    const { data: html } = await axios.get(
        `https://www.instagram.com/p/${shortcode}/embed/captioned/`,
        {
            timeout: 12000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
                'Accept': 'text/html,application/xhtml+xml',
                'Accept-Language': 'en-US,en;q=0.9',
            }
        }
    );

    const results = [];

    // Video URL patterns in embed HTML
    const videoPatterns = [
        /\"video_url\":\"(https:\\\/\\\/[^\"]+\.mp4[^\"]*)\"/g,
        /src=\\\"(https:\\\/\\\/[^\\\"]+\.mp4[^\\\"]*)\\\"/g,
        /"url":"(https:\/\/[^"]+\.mp4[^"]*)"/g,
    ];

    for (const pat of videoPatterns) {
        let m;
        while ((m = pat.exec(html)) !== null) {
            const videoUrl = m[1].replace(/\\u0026/g, '&').replace(/\\\//g, '/');
            if (videoUrl && !results.find(r => r.url === videoUrl)) {
                results.push({ url: videoUrl, type: 'video' });
            }
        }
    }

    // Image URL patterns
    const imgPatterns = [
        /\"display_url\":\"(https:\\\/\\\/[^\"]+\.jpg[^\"]*)\"/g,
        /\"thumbnail_src\":\"(https:\\\/\\\/[^\"]+\.jpg[^\"]*)\"/g,
        /"src":"(https:\/\/[^"]+\.jpg[^"]*)"/g,
    ];
    if (!results.length) {
        for (const pat of imgPatterns) {
            let m;
            while ((m = pat.exec(html)) !== null) {
                const imgUrl = m[1].replace(/\\u0026/g, '&').replace(/\\\//g, '/');
                if (imgUrl && !results.find(r => r.url === imgUrl)) {
                    results.push({ url: imgUrl, type: 'image' });
                    break;
                }
            }
        }
    }

    // Extract OG image as last resort
    if (!results.length) {
        const ogImg = html.match(/<meta[^>]*property="og:image"[^>]*content="([^"]+)"/);
        const ogVid = html.match(/<meta[^>]*property="og:video"[^>]*content="([^"]+)"/);
        if (ogVid) results.push({ url: ogVid[1], type: 'video' });
        else if (ogImg) results.push({ url: ogImg[1], type: 'image' });
    }

    if (!results.length) throw new Error('No media found in embed page');
    return results;
}

// ─── Strategy 3: Nexoracle free API ─────────────────────────────────────────
async function tryNexoracle(url) {
    const { data } = await axios.get(
        `https://api.nexoracle.com/downloaders/igdl?url=${encodeURIComponent(url)}&apikey=free_for_use`,
        { timeout: 12000, headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' } }
    );
    if (typeof data !== 'object' || Array.isArray(data) === false && !data?.result && !data?.media) {
        throw new Error('Nexoracle returned unexpected format');
    }
    const items = data?.result || data?.media || (Array.isArray(data) ? data : []);
    if (!items.length) throw new Error('Empty result');
    return items.map(item => ({
        url:  item.url || item.video_url || item.image_url,
        type: item.type === 'video' || (item.url || '').includes('.mp4') ? 'video' : 'image',
    })).filter(i => i.url);
}

// ─── Main plugin ─────────────────────────────────────────────────────────────
module.exports = {
    commands:    ['instagram', 'igdl', 'ig', 'insta'],
    description: 'Download Instagram posts, reels, and stories',
    permission:  'public',
    group:       true,
    private:     true,

    run: async (sock, message, args, { jid, contextInfo, reply }) => {
        const url = args[0];
        if (!url || !url.includes('instagram.com')) {
            return reply(fmt(`📸 Please provide a valid Instagram URL.\nExample: \`.ig https://www.instagram.com/p/xyz/\``));
        }

        const botName = getStr('botName') || 'Silva MD';

        const loading = await sock.sendMessage(jid, {
            text: fmt('⏳ Fetching Instagram content…'),
            contextInfo
        }, { quoted: message });

        const deleteLoading = () => loading && sock.sendMessage(jid, { delete: loading.key }).catch(() => {});

        const STRATEGIES = [
            { name: 'Embed Page',  fn: () => tryEmbedPage(url)  },
            { name: 'Nexoracle',   fn: () => tryNexoracle(url)  },
            { name: 'oEmbed',      fn: () => tryOEmbed(url)      },
        ];

        let items = null;
        let lastErr = 'All sources failed';

        for (const strategy of STRATEGIES) {
            try {
                const result = await strategy.fn();
                if (result?.length) { items = result; console.log(`[IG] Success via ${strategy.name}`); break; }
            } catch (e) {
                lastErr = e.message;
                console.warn(`[IG] ${strategy.name} failed: ${e.message}`);
            }
        }

        await deleteLoading();

        if (!items?.length) {
            return reply(fmt(
                `❌ *Instagram download failed*\n\n` +
                `_Reason: ${lastErr}_\n\n` +
                `💡 *Tips:*\n` +
                `• Make sure the post is *public*\n` +
                `• Reels and posts work best\n` +
                `• Stories may not be downloadable`
            ));
        }

        const slice = items.slice(0, 5);
        for (let i = 0; i < slice.length; i++) {
            const item = slice[i];
            if (!item.url) continue;

            const isVideo = item.type === 'video';
            const caption = i === 0
                ? fmt(`📸 *Instagram Download*\n${slice.length > 1 ? `_(1 of ${slice.length} items)_\n` : ''}\n_Powered by ${botName}_`)
                : `_(${i + 1} of ${slice.length})_`;

            try {
                await sock.sendMessage(jid, {
                    [isVideo ? 'video' : 'image']: { url: item.url },
                    caption,
                    contextInfo: {
                        ...contextInfo,
                        externalAdReply: {
                            title:                 'Instagram',
                            body:                  `Powered by ${botName}`,
                            thumbnailUrl:          getStr('pic1') || 'https://files.catbox.moe/5uli5p.jpeg',
                            sourceUrl:             url,
                            mediaType:             1,
                            renderLargerThumbnail: true,
                        }
                    }
                }, { quoted: message });
            } catch (sendErr) {
                console.warn(`[IG] Failed to send item ${i + 1}:`, sendErr.message);
            }
        }
    }
};

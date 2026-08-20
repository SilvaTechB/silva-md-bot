'use strict';

const axios  = require('axios');
const qs     = require('querystring');
const fs     = require('fs');
const path   = require('path');
const config = require('../config');
const { fmt, getStr } = require('../lib/theme');

const UA_BROWSER = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
const UA_IPHONE  = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
const UA_ANDROID = 'Instagram 195.0.0.31.123 Android (26/8.0.0; 480dpi; 1080x1920; OnePlus; OnePlus5T; op8t19; en_IN; 302733750)';

const SESSION_FILE = path.join(__dirname, '../data/ig_session.json');

// ─── Session persistence ────────────────────────────────────────────────────
function loadSession() {
    try {
        if (fs.existsSync(SESSION_FILE)) {
            const d = JSON.parse(fs.readFileSync(SESSION_FILE, 'utf8'));
            return d.sessionid || '';
        }
    } catch (_) {}
    return config.INSTAGRAM_SESSION || '';
}

function saveSession(sessionid) {
    try {
        fs.mkdirSync(path.dirname(SESSION_FILE), { recursive: true });
        fs.writeFileSync(SESSION_FILE, JSON.stringify({ sessionid }), 'utf8');
    } catch (_) {}
}

// ─── Extract shortcode from any IG URL ──────────────────────────────────────
function extractShortcode(url) {
    const m = url.match(/instagram\.com\/(?:p|reel|tv|reels\/videos|stories\/[^/]+)\/([A-Za-z0-9_-]+)/);
    return m?.[1] || null;
}

// ─── Convert shortcode → numeric media ID ───────────────────────────────────
function shortcodeToId(code) {
    const A = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
    let id = BigInt(0);
    for (const ch of code) id = id * 64n + BigInt(A.indexOf(ch));
    return id.toString();
}

// ─── Safe error string ───────────────────────────────────────────────────────
function errMsg(e) {
    return String(e?.message || e || 'unknown error').substring(0, 120);
}

// ─── Parse download URLs from HTML (download-site output) ───────────────────
function parseDownloadHtml(html) {
    if (!html || typeof html !== 'string') return [];
    const results = [];
    const videoPatterns = [
        /href=["']([^"']+\.mp4[^"']*)["']/g,
        /"url"\s*:\s*"(https?:\/\/[^"]+\.mp4[^"]*)"/g,
        /src=["'](https?:\/\/[^"']+\.mp4[^"']*)["']/g,
        /"download"\s*:\s*"(https?:\/\/[^"]+)"/g,
        /href=["'](https?:\/\/[^"']*scontent[^"']+)["'][^>]*download/g,
    ];
    for (const pat of videoPatterns) {
        let m;
        while ((m = pat.exec(html)) !== null) {
            const u = m[1].replace(/&amp;/g, '&').replace(/\\u0026/g, '&');
            if (u && !results.find(r => r.url === u)) results.push({ url: u, type: 'video' });
        }
    }
    if (!results.length) {
        const imgPatterns = [
            /href=["'](https?:\/\/[^"']+\.jpg[^"']*)["'][^>]*download/g,
            /"url"\s*:\s*"(https?:\/\/[^"]+\.jpg[^"]*)"/g,
        ];
        for (const pat of imgPatterns) {
            let m;
            while ((m = pat.exec(html)) !== null) {
                const u = m[1].replace(/&amp;/g, '&').replace(/\\u0026/g, '&');
                if (u && !results.find(r => r.url === u)) results.push({ url: u, type: 'image' });
            }
        }
    }
    return results;
}

// ═══════════════════════════════════════════════════════════════════════════
// STRATEGY 1: Authenticated session cookie (most reliable from server IPs)
// Set your Instagram sessionid via .setigsession <cookie> or INSTAGRAM_SESSION env
// ═══════════════════════════════════════════════════════════════════════════
async function trySessionCookie(url) {
    const sessionid = loadSession();
    if (!sessionid) throw new Error('No Instagram session configured');

    const shortcode = extractShortcode(url);
    if (!shortcode) throw new Error('No shortcode');

    const cookies = `sessionid=${sessionid}; ds_user_id=0; ig_did=XXXXXXXX; csrftoken=missing`;

    // Try GraphQL with session cookie
    const { data } = await axios.post(
        'https://www.instagram.com/graphql/query',
        qs.stringify({
            variables: JSON.stringify({ shortcode }),
            doc_id: '8845758582119845',
        }),
        {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'User-Agent': UA_BROWSER,
                'X-IG-App-ID': '936619743392459',
                'Cookie': cookies,
                'Referer': 'https://www.instagram.com/',
                'Origin': 'https://www.instagram.com',
                'Accept': '*/*',
            },
            timeout: 15000,
        }
    );

    if (data?.data?.require_login || data?.message?.includes('login')) {
        throw new Error('Session expired or invalid — please update with .setigsession');
    }

    const media = data?.data?.xdt_shortcode_media;
    if (!media) {
        // Also try media info endpoint with session
        const mediaId = shortcodeToId(shortcode);
        const r2 = await axios.get(
            `https://i.instagram.com/api/v1/media/${mediaId}/info/`,
            {
                headers: {
                    'User-Agent': UA_ANDROID,
                    'Cookie': `sessionid=${sessionid}`,
                    'X-IG-App-ID': '567067343352427',
                },
                timeout: 12000,
            }
        );
        if (r2.data?.require_login) throw new Error('Session invalid on mobile API');
        const item = r2.data?.items?.[0];
        if (!item) throw new Error('Session: no item');
        const results = [];
        if (item.video_versions?.length) results.push({ url: item.video_versions[0].url, type: 'video' });
        else if (item.image_versions2?.candidates?.length) results.push({ url: item.image_versions2.candidates[0].url, type: 'image' });
        else if (item.carousel_media) {
            for (const c of item.carousel_media) {
                if (c.video_versions?.length) results.push({ url: c.video_versions[0].url, type: 'video' });
                else if (c.image_versions2?.candidates?.length) results.push({ url: c.image_versions2.candidates[0].url, type: 'image' });
            }
        }
        if (!results.length) throw new Error('Session: no media extracted');
        return results;
    }

    const results = [];
    if (media.__typename === 'XDTGraphSidecar') {
        for (const e of (media.edge_sidecar_to_children?.edges || [])) {
            const n = e.node;
            results.push({ url: n.is_video ? n.video_url : n.display_url, type: n.is_video ? 'video' : 'image' });
        }
    } else {
        results.push({ url: media.is_video ? media.video_url : media.display_url, type: media.is_video ? 'video' : 'image' });
    }
    if (!results.length || !results[0].url) throw new Error('Session: empty result');
    return results;
}

// ═══════════════════════════════════════════════════════════════════════════
// STRATEGY 2: Instagram GraphQL (unauthenticated — works on some posts)
// ═══════════════════════════════════════════════════════════════════════════
async function tryGraphQL(url) {
    const shortcode = extractShortcode(url);
    if (!shortcode) throw new Error('No shortcode');

    const { data } = await axios.post(
        'https://www.instagram.com/graphql/query',
        qs.stringify({
            variables: JSON.stringify({ shortcode }),
            doc_id: '8845758582119845',
        }),
        {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'User-Agent': UA_BROWSER,
                'X-IG-App-ID': '936619743392459',
                'Referer': 'https://www.instagram.com/',
                'Origin': 'https://www.instagram.com',
            },
            timeout: 12000,
        }
    );

    const media = data?.data?.xdt_shortcode_media;
    if (!media) throw new Error('GraphQL: no media (login required)');

    const results = [];
    if (media.__typename === 'XDTGraphSidecar') {
        for (const e of (media.edge_sidecar_to_children?.edges || [])) {
            const n = e.node;
            results.push({ url: n.is_video ? n.video_url : n.display_url, type: n.is_video ? 'video' : 'image' });
        }
    } else {
        results.push({ url: media.is_video ? media.video_url : media.display_url, type: media.is_video ? 'video' : 'image' });
    }
    if (!results.length || !results[0].url) throw new Error('GraphQL: empty');
    return results;
}

// ═══════════════════════════════════════════════════════════════════════════
// STRATEGY 3: Instagram Mobile API v1
// ═══════════════════════════════════════════════════════════════════════════
async function tryMobileApi(url) {
    const shortcode = extractShortcode(url);
    if (!shortcode) throw new Error('No shortcode');
    const mediaId = shortcodeToId(shortcode);

    const { data } = await axios.get(
        `https://i.instagram.com/api/v1/media/${mediaId}/info/`,
        {
            headers: {
                'User-Agent': UA_ANDROID,
                'X-IG-Capabilities': '3brTvwM=',
                'X-IG-Connection-Type': 'WIFI',
                'X-IG-App-ID': '567067343352427',
                'Accept-Language': 'en-US',
            },
            timeout: 12000,
        }
    );

    if (data?.require_login || data?.message?.includes('login')) throw new Error('Mobile API: login required');
    const item = data?.items?.[0];
    if (!item) throw new Error('Mobile API: no item');

    const results = [];
    if (item.video_versions?.length) {
        results.push({ url: item.video_versions[0].url, type: 'video' });
    } else if (item.image_versions2?.candidates?.length) {
        results.push({ url: item.image_versions2.candidates[0].url, type: 'image' });
    } else if (item.carousel_media) {
        for (const c of item.carousel_media) {
            if (c.video_versions?.length) results.push({ url: c.video_versions[0].url, type: 'video' });
            else if (c.image_versions2?.candidates?.length) results.push({ url: c.image_versions2.candidates[0].url, type: 'image' });
        }
    }
    if (!results.length) throw new Error('Mobile API: no media');
    return results;
}

// ═══════════════════════════════════════════════════════════════════════════
// STRATEGY 4: Embed Page — OG tags + JSON data extraction
// ═══════════════════════════════════════════════════════════════════════════
async function tryEmbedPage(url) {
    const shortcode = extractShortcode(url);
    if (!shortcode) throw new Error('No shortcode');

    const { data: html } = await axios.get(
        `https://www.instagram.com/p/${shortcode}/embed/captioned/`,
        {
            headers: {
                'User-Agent': UA_IPHONE,
                'Accept': 'text/html,application/xhtml+xml',
                'Accept-Language': 'en-US,en;q=0.9',
            },
            timeout: 15000,
        }
    );

    const results = [];
    const videoPatterns = [
        /"video_url":"(https:\\\/\\\/[^"]+\.mp4[^"]*)"/g,
        /"video_url":"(https:\/\/[^"]+\.mp4[^"]*)"/g,
        /src=\\?"(https:\\\/\\\/[^"]+\.mp4[^"]*)\\"?/g,
        /"url":"(https:[^"]+\.mp4[^"]*)"/g,
        /og:video.*?content="([^"]+)"/g,
    ];
    for (const pat of videoPatterns) {
        let m;
        while ((m = pat.exec(html)) !== null) {
            const u = m[1].replace(/\\u0026/g, '&').replace(/\\\//g, '/').replace(/&amp;/g, '&');
            if (u && !results.find(r => r.url === u)) results.push({ url: u, type: 'video' });
        }
    }

    if (!results.length) {
        const ogVid = html.match(/<meta[^>]*property=["']og:video["'][^>]*content=["']([^"']+)["']/);
        const ogImg = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/);
        if (ogVid?.[1]) results.push({ url: ogVid[1], type: 'video' });
        else if (ogImg?.[1]) results.push({ url: ogImg[1], type: 'image' });
    }

    if (!results.length) {
        const imgPatterns = [
            /"display_url":"(https:\\\/\\\/[^"]+\.jpg[^"]*)"/g,
            /"thumbnail_src":"(https:\\\/\\\/[^"]+\.jpg[^"]*)"/g,
        ];
        for (const pat of imgPatterns) {
            let m;
            if ((m = pat.exec(html)) !== null) {
                const u = m[1].replace(/\\u0026/g, '&').replace(/\\\//g, '/');
                if (u) { results.push({ url: u, type: 'image' }); break; }
            }
        }
    }

    if (!results.length) throw new Error('Embed page: no media');
    return results;
}

// ═══════════════════════════════════════════════════════════════════════════
// STRATEGY 5: snapsave.app
// ═══════════════════════════════════════════════════════════════════════════
async function trySnapsave(url) {
    const r1 = await axios.get('https://snapsave.app/', {
        headers: { 'User-Agent': UA_BROWSER },
        timeout: 10000,
    });
    const cookies = (r1.headers['set-cookie'] || []).map(c => c.split(';')[0]).join('; ');

    const r2 = await axios.post('https://snapsave.app/action.php',
        qs.stringify({ url }),
        {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'X-Requested-With': 'XMLHttpRequest',
                'Cookie': cookies,
                'Referer': 'https://snapsave.app/',
                'Origin': 'https://snapsave.app',
                'User-Agent': UA_BROWSER,
            },
            timeout: 15000,
        }
    );

    const raw = typeof r2.data === 'string' ? r2.data : JSON.stringify(r2.data);

    let decoded = raw;
    try {
        const fakeEvalHolder = { val: '' };
        const patched = raw.replace(/\beval\s*\(/, 'fakeEvalHolder.val=(');
        const fn = new Function('fakeEvalHolder', patched);
        fn(fakeEvalHolder);
        if (fakeEvalHolder.val) decoded = fakeEvalHolder.val;
    } catch (_) {}

    if (decoded.includes('Unable to connect') || decoded.includes('error_api')) {
        throw new Error('snapsave: Instagram blocked');
    }

    const items = parseDownloadHtml(decoded);
    if (!items.length) throw new Error('snapsave: no media found');
    return items;
}

// ═══════════════════════════════════════════════════════════════════════════
// STRATEGY 6: fastdl.app
// ═══════════════════════════════════════════════════════════════════════════
async function tryFastDl(url) {
    const r = await axios.post('https://fastdl.app/api/convert',
        JSON.stringify({ url }),
        {
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': UA_BROWSER,
                'Referer': 'https://fastdl.app/',
                'Origin': 'https://fastdl.app',
            },
            timeout: 12000,
        }
    );
    const d = r.data;
    if (d?.info?.includes('error') || d?.code === '') throw new Error('fastdl: invalid');
    const links = Array.isArray(d?.links) ? d.links : (d?.url ? [{ url: d.url }] : []);
    if (!links.length) throw new Error('fastdl: no links');
    return links.map(l => ({
        url:  l.url || l.link,
        type: (l.quality?.includes('audio') || (l.url || '').includes('.mp3')) ? 'audio' : 'video',
    })).filter(i => i.url);
}

// ═══════════════════════════════════════════════════════════════════════════
// STRATEGY 7: igram.world
// ═══════════════════════════════════════════════════════════════════════════
async function tryIgram(url) {
    const r1 = await axios.get('https://igram.world/', {
        headers: { 'User-Agent': UA_BROWSER, 'Accept': 'text/html' },
        timeout: 10000,
        maxRedirects: 5,
    });
    const cookies = (r1.headers['set-cookie'] || []).map(c => c.split(';')[0]).join('; ');
    const token   = (r1.data.match(/name="_token" value="([^"]+)"/) || [])[1] || '';

    const r2 = await axios.post('https://igram.world/',
        qs.stringify({ url, _token: token }),
        {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Cookie': cookies,
                'X-Requested-With': 'XMLHttpRequest',
                'Referer': 'https://igram.world/',
                'Origin': 'https://igram.world',
                'User-Agent': UA_BROWSER,
                'Accept': 'application/json, */*',
            },
            timeout: 15000,
            maxRedirects: 5,
        }
    );
    const d = r2.data;
    if (typeof d === 'string' && d.includes('<!DOCTYPE')) throw new Error('igram: returned HTML');
    if (d?.info?.includes('error') || d?.info?.includes('Invalid')) throw new Error('igram: ' + (d?.info || 'invalid'));
    const links = Array.isArray(d?.links) ? d.links :
                  Array.isArray(d?.url)   ? d.url.map(u => ({ url: u })) :
                  d?.url ? [{ url: d.url }] : [];
    if (!links.length) throw new Error('igram: no links');
    return links.map(l => ({
        url:  l.url || l.download_url,
        type: (l.quality || '').toLowerCase().includes('audio') ? 'audio' : 'video',
    })).filter(i => i.url);
}

// ═══════════════════════════════════════════════════════════════════════════
// STRATEGY 8: oEmbed — thumbnail fallback for images
// ═══════════════════════════════════════════════════════════════════════════
async function tryOEmbed(url) {
    const { data } = await axios.get(
        `https://api.instagram.com/oembed/?url=${encodeURIComponent(url)}&maxwidth=1080`,
        {
            headers: { 'User-Agent': UA_BROWSER },
            timeout: 10000,
        }
    );
    if (!data?.thumbnail_url) throw new Error('oEmbed: no thumbnail');
    return [{
        url:     data.thumbnail_url,
        type:    'image',
        caption: data.title || '',
        author:  data.author_name || '',
    }];
}

// ═══════════════════════════════════════════════════════════════════════════
// STRATEGY 9: Parallel free API sweep
// ═══════════════════════════════════════════════════════════════════════════
async function tryParallelApis(url) {
    const shortcode = extractShortcode(url);

    const attempts = [
        // saveig.app
        axios.post('https://saveig.app/api/ajaxSearch',
            qs.stringify({ q: url, t: 'media', lang: 'en' }),
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'X-Requested-With': 'XMLHttpRequest',
                    'Origin': 'https://saveig.app',
                    'Referer': 'https://saveig.app/',
                    'User-Agent': UA_BROWSER,
                },
                timeout: 10000,
            }
        ).then(r => {
            const d = r.data;
            if (typeof d === 'object' && d?.data) {
                const items = parseDownloadHtml(d.data);
                if (items.length) return { source: 'saveig', items };
            }
            throw new Error('saveig: no data');
        }),

        // snapinsta.app
        axios.post('https://snapinsta.app/api/ajaxSearch',
            qs.stringify({ q: url, t: 'media', lang: 'en' }),
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'X-Requested-With': 'XMLHttpRequest',
                    'Origin': 'https://snapinsta.app',
                    'Referer': 'https://snapinsta.app/',
                    'User-Agent': UA_BROWSER,
                },
                timeout: 10000,
            }
        ).then(r => {
            const d = r.data;
            if (typeof d === 'object' && d?.data) {
                const items = parseDownloadHtml(d.data);
                if (items.length) return { source: 'snapinsta', items };
            }
            throw new Error('snapinsta: no data');
        }),

        // nexoracle
        axios.get(`https://api.nexoracle.com/social/ig?url=${encodeURIComponent(url)}`, {
            headers: { 'User-Agent': UA_BROWSER },
            timeout: 10000,
        }).then(r => {
            const d = r.data;
            const arr = d?.result || d?.media || (Array.isArray(d) ? d : []);
            if (!arr.length) throw new Error('nexoracle: empty');
            return {
                source: 'nexoracle',
                items: arr.map(i => ({
                    url:  i.url || i.video_url || i.image_url,
                    type: (i.url || '').includes('.mp4') ? 'video' : 'image',
                })).filter(i => i.url),
            };
        }),

        // instadownload.net via wp-json
        shortcode ? axios.get(
            `https://instadownload.net/wp-json/aio-dl/video-data/?url=${encodeURIComponent(url)}`,
            { headers: { 'User-Agent': UA_BROWSER }, timeout: 10000 }
        ).then(r => {
            const d = r.data;
            if (!d?.medias?.length) throw new Error('instadownload: empty');
            return {
                source: 'instadownload',
                items: d.medias.map(m => ({
                    url:  m.url,
                    type: m.quality?.toLowerCase().includes('audio') ? 'audio' : 'video',
                })).filter(i => i.url),
            };
        }) : Promise.reject(new Error('no shortcode')),
    ];

    const results = await Promise.allSettled(attempts);
    for (const r of results) {
        if (r.status === 'fulfilled' && r.value?.items?.length) {
            console.log(`[IG] Parallel winner: ${r.value.source}`);
            return r.value.items;
        }
    }
    throw new Error('All parallel APIs failed');
}

// ═══════════════════════════════════════════════════════════════════════════
// STRATEGY 10: instagram-url-direct npm package
// ═══════════════════════════════════════════════════════════════════════════
async function tryNpmPackage(url) {
    let instagramGetUrl;
    try { instagramGetUrl = require('instagram-url-direct'); } catch (_) {
        throw new Error('npm pkg not installed');
    }
    if (typeof instagramGetUrl !== 'function' && instagramGetUrl?.default) {
        instagramGetUrl = instagramGetUrl.default;
    }
    if (typeof instagramGetUrl !== 'function') throw new Error('npm pkg: not a function');
    const result = await instagramGetUrl(url);
    if (!result || !result.url_list?.length) throw new Error('npm: no result');
    return result.url_list.filter(Boolean).map(u => ({
        url:  u,
        type: u.includes('.mp4') ? 'video' : 'image',
    }));
}

// ═══════════════════════════════════════════════════════════════════════════
// Main plugin
// ═══════════════════════════════════════════════════════════════════════════
module.exports = [
    // ── Download command ────────────────────────────────────────────────────
    {
        commands:    ['instagram', 'igdl', 'ig', 'insta'],
        description: 'Download Instagram posts, reels, and stories',
        usage:       '<instagram_url>',
        permission:  'public',
        group:       true,
        private:     true,

        run: async (sock, message, args, { jid, contextInfo, reply }) => {
            const url = args[0];
            if (!url || !url.includes('instagram.com')) {
                const hasSession = !!loadSession();
                return reply(fmt(
                    `📸 *Instagram Downloader*\n\n` +
                    `Please provide an Instagram URL.\n` +
                    `\`\`\`Example:\n.ig https://www.instagram.com/reel/XYZ/\`\`\`\n\n` +
                    `🔐 *Session:* ${hasSession ? '✅ Configured' : '❌ Not set — use *.setigsession* for best results'}`
                ));
            }

            const botName = getStr('botName') || 'Silva MD';
            const hasSession = !!loadSession();

            const loading = await sock.sendMessage(jid, {
                text: fmt(`⏳ _Fetching Instagram content…_\n${hasSession ? '🔑 Using authenticated session' : '🌐 No session — trying public strategies'}`),
                contextInfo,
            }, { quoted: message }).catch(() => null);

            const deleteLoading = () => {
                if (loading?.key) sock.sendMessage(jid, { delete: loading.key }).catch(() => {});
            };

            // Strategy chain — session cookie first, then public fallbacks
            const STRATEGIES = [
                { name: 'Session Cookie',  fn: () => trySessionCookie(url)  },
                { name: 'GraphQL',         fn: () => tryGraphQL(url)         },
                { name: 'Mobile API',      fn: () => tryMobileApi(url)       },
                { name: 'Embed Page',      fn: () => tryEmbedPage(url)       },
                { name: 'Parallel APIs',   fn: () => tryParallelApis(url)    },
                { name: 'SnipSave',        fn: () => trySnapsave(url)        },
                { name: 'FastDL',          fn: () => tryFastDl(url)          },
                { name: 'iGram',           fn: () => tryIgram(url)           },
                { name: 'NPM Package',     fn: () => tryNpmPackage(url)      },
                { name: 'oEmbed',          fn: () => tryOEmbed(url)          },
            ];

            let items     = null;
            let lastErr   = 'All sources failed';
            let usedStrat = '';

            for (const strat of STRATEGIES) {
                try {
                    const result = await strat.fn();
                    if (result?.length && result[0]?.url) {
                        items     = result;
                        usedStrat = strat.name;
                        console.log(`[IG] ✓ Success via ${strat.name}`);
                        break;
                    }
                } catch (e) {
                    lastErr = errMsg(e);
                    console.warn(`[IG] ✗ ${strat.name}: ${lastErr}`);
                }
            }

            await deleteLoading();

            if (!items?.length) {
                const sessionSet = !!loadSession();
                return reply(fmt(
                    `❌ *Instagram download failed*\n\n` +
                    (sessionSet
                        ? `_Your session may have expired. Use *.setigsession* to update it._\n\n`
                        : `_No Instagram session is set. Send *.setigsession <your sessionid>* to the bot (owner only) for reliable downloads._\n\n`
                    ) +
                    `💡 *How to get your session ID:*\n` +
                    `1. Log in to Instagram on Chrome\n` +
                    `2. Press F12 → Application → Cookies → instagram.com\n` +
                    `3. Copy the value of *sessionid*\n` +
                    `4. Send: *.setigsession <paste here>*\n\n` +
                    `_Last error: ${String(lastErr).substring(0, 80)}_`
                ));
            }

            const mediaItems = items.filter(i => i.type !== 'audio').slice(0, 6);
            const sendItems  = mediaItems.length ? mediaItems : items.slice(0, 1);

            const externalAdReply = {
                title:                 'Instagram Download',
                body:                  `Powered by ${botName}`,
                thumbnailUrl:          getStr('pic1') || 'https://files.catbox.moe/5uli5p.jpeg',
                sourceUrl:             url,
                mediaType:             1,
                renderLargerThumbnail: true,
            };

            for (let i = 0; i < sendItems.length; i++) {
                const item    = sendItems[i];
                const isVideo = item.type === 'video';
                const caption = i === 0
                    ? fmt(
                        `📸 *Instagram Download*\n` +
                        (sendItems.length > 1 ? `_(${i + 1} of ${sendItems.length} items)_\n` : '') +
                        (item.author  ? `👤 ${item.author}\n`  : '') +
                        (item.caption ? `📝 ${item.caption.substring(0, 200)}\n` : '') +
                        `\n_via ${botName}_`
                      )
                    : `_(${i + 1} of ${sendItems.length})_`;

                try {
                    await sock.sendMessage(jid, {
                        [isVideo ? 'video' : 'image']: { url: item.url },
                        caption,
                        contextInfo: { ...contextInfo, externalAdReply },
                    }, { quoted: message });

                    if (i < sendItems.length - 1) await new Promise(r => setTimeout(r, 800));
                } catch (sendErr) {
                    console.warn(`[IG] Send item ${i + 1} failed:`, errMsg(sendErr));
                    if (isVideo) {
                        try {
                            await sock.sendMessage(jid, {
                                document: { url: item.url },
                                mimetype: 'video/mp4',
                                fileName: `instagram_${Date.now()}.mp4`,
                                caption,
                            }, { quoted: message });
                        } catch (_) {}
                    }
                }
            }
        },
    },

    // ── Owner: set Instagram session cookie ─────────────────────────────────
    {
        commands:    ['setigsession', 'igsession'],
        description: 'Set Instagram session cookie for downloads (owner only)',
        usage:       '<sessionid_cookie_value>',
        permission:  'owner',
        group:       true,
        private:     true,

        run: async (sock, message, args, { reply }) => {
            const sessionid = (args[0] || '').trim();
            if (!sessionid) {
                const current = loadSession();
                return reply(fmt(
                    `🔐 *Instagram Session Manager*\n\n` +
                    `Current status: ${current ? '✅ Session is set' : '❌ No session configured'}\n\n` +
                    `*Usage:* \`.setigsession <your_sessionid>\`\n\n` +
                    `*How to get it:*\n` +
                    `1. Log in to Instagram on Chrome\n` +
                    `2. Press F12 → Application tab → Cookies → instagram.com\n` +
                    `3. Find the cookie named *sessionid*\n` +
                    `4. Copy its value and send it here\n\n` +
                    `_Your session stays private on this server only._`
                ));
            }

            saveSession(sessionid);

            // Quick verify
            let verified = false;
            try {
                const r = await axios.get('https://www.instagram.com/accounts/edit/', {
                    headers: {
                        'User-Agent': UA_BROWSER,
                        'Cookie': `sessionid=${sessionid}`,
                    },
                    timeout: 10000,
                    maxRedirects: 0,
                    validateStatus: s => s < 400,
                });
                verified = r.status === 200 && !String(r.data || '').includes('"login_required"');
            } catch (_) {}

            return reply(fmt(
                `🔐 *Instagram Session ${verified ? 'Verified ✅' : 'Saved ⚠️'}*\n\n` +
                (verified
                    ? `Session is valid and active. Downloads will now work reliably.`
                    : `Session saved, but verification was inconclusive. Try *.ig <url>* to confirm it works.`
                ) +
                `\n\n_Use *.setigsession* again to update or check status._`
            ));
        },
    },

    // ── Owner: clear Instagram session ──────────────────────────────────────
    {
        commands:    ['clearigsession', 'rmigsession'],
        description: 'Remove saved Instagram session cookie (owner only)',
        usage:       '',
        permission:  'owner',
        group:       true,
        private:     true,

        run: async (sock, message, args, { reply }) => {
            try { fs.unlinkSync(SESSION_FILE); } catch (_) {}
            return reply(fmt(`🗑️ *Instagram session cleared.*\n\nDownloads will now use public (unauthenticated) strategies only.`));
        },
    },
];

'use strict';

const axios  = require('axios');
const { fmt } = require('../lib/theme');

module.exports = {
    commands: [
        'google', 'npm', 'apkmirror', 'happymod',
        'ggleimage', 'unsplash', 'wallpapers', 'wattpad',
        'yts', 'spotifysearch'
    ],
    description: 'Extended search commands',
    permission:  'public',
    group:       true,
    private:     true,

    run: async (sock, message, args, ctx) => {
        const { jid, contextInfo } = ctx;
        const cmd  = (message.message?.extendedTextMessage?.text
            || message.message?.conversation || '').trim().split(/\s+/)[0].replace(/^\./, '').toLowerCase();
        const query = args.join(' ').trim();
        const send  = (t) => sock.sendMessage(jid, { text: fmt(t), contextInfo }, { quoted: message });

        if (!query && !['wallpapers'].includes(cmd)) {
            return send(`❌ *Usage:* \`.${cmd} <search query>\``);
        }

        await sock.sendPresenceUpdate('composing', jid);

        if (cmd === 'google') {
            try {
                const res = await axios.get(`https://api.siputzx.my.id/api/search/google?q=${encodeURIComponent(query)}`, { timeout: 15000 });
                const results = res.data?.data?.slice(0, 5) || [];
                if (!results.length) return send(`🔍 No Google results for: *${query}*`);
                const list = results.map((r, i) =>
                    `*${i + 1}.* ${r.title}\n   ${r.description?.slice(0, 100) || ''}\n   🔗 ${r.link || r.url || ''}`
                ).join('\n\n');
                return send(`🔍 *Google: "${query}"*\n\n${list}`);
            } catch {
                return send(`🔍 *Google: "${query}"*\n\nSearch timed out. Try: https://google.com/search?q=${encodeURIComponent(query)}`);
            }
        }

        if (cmd === 'npm') {
            try {
                const res = await axios.get(`https://registry.npmjs.org/${encodeURIComponent(query)}`, { timeout: 10000 });
                const d   = res.data;
                const latest = d?.['dist-tags']?.latest;
                const v   = d?.versions?.[latest] || {};
                return send(
                    `📦 *NPM: ${d.name}*\n\n` +
                    `📝 ${d.description?.slice(0, 200) || 'No description'}\n\n` +
                    `🏷️ *Latest:* ${latest}\n` +
                    `📅 *Modified:* ${d.time?.[latest]?.split('T')[0] || 'N/A'}\n` +
                    `📥 *Install:* \`npm install ${d.name}\`\n` +
                    `🔗 https://npmjs.com/package/${d.name}`
                );
            } catch { return send(`❌ Package \`${query}\` not found on npm.`); }
        }

        if (cmd === 'apkmirror') {
            return send(`📱 *APK Mirror: "${query}"*\n\n🔗 https://www.apkmirror.com/?post_type=app_release&searchtype=apk&s=${encodeURIComponent(query)}\n\n_Click the link to search on APKMirror_`);
        }

        if (cmd === 'happymod') {
            return send(`🎮 *HappyMod: "${query}"*\n\n🔗 https://www.happymod.com/search.html?q=${encodeURIComponent(query)}\n\n_Click the link to search HappyMod_`);
        }

        if (cmd === 'ggleimage') {
            try {
                const res = await axios.get(`https://api.siputzx.my.id/api/search/image?q=${encodeURIComponent(query)}`, { timeout: 15000 });
                const imgs = res.data?.data?.slice(0, 3) || [];
                if (!imgs.length) return send(`🖼️ No images found for: *${query}*`);
                for (const img of imgs) {
                    const url = img?.url || img?.link;
                    if (url) {
                        try {
                            const imgRes = await axios.get(url, { responseType: 'arraybuffer', timeout: 10000 });
                            await sock.sendMessage(jid, { image: Buffer.from(imgRes.data), caption: fmt(`🖼️ ${query}`), contextInfo }, { quoted: message });
                        } catch {}
                    }
                }
            } catch {
                return send(`🖼️ *Google Image: "${query}"*\n\n🔗 https://images.google.com/search?q=${encodeURIComponent(query)}\n\n_Search on Google Images_`);
            }
            return;
        }

        if (cmd === 'unsplash') {
            try {
                const res = await axios.get(`https://api.unsplash.com/search/photos?query=${encodeURIComponent(query || 'nature')}&per_page=3&client_id=iVxPNYqvIkbQcaIwfC7cFHHMu5CIYvOVPGLRBnj9dj0`, { timeout: 10000 });
                const photos = res.data?.results || [];
                if (!photos.length) throw new Error('no results');
                for (const p of photos.slice(0, 2)) {
                    const url = p.urls?.regular || p.urls?.small;
                    if (url) {
                        const imgRes = await axios.get(url, { responseType: 'arraybuffer', timeout: 15000 });
                        await sock.sendMessage(jid, {
                            image: Buffer.from(imgRes.data),
                            caption: fmt(`📷 *${p.description || p.alt_description || query}*\n📸 By: ${p.user?.name || 'Unknown'}`),
                            contextInfo
                        }, { quoted: message });
                    }
                }
            } catch {
                const res2 = await axios.get(`https://api.siputzx.my.id/api/search/image?q=${encodeURIComponent(query || 'nature')}`, { timeout: 10000 }).catch(() => null);
                const url  = res2?.data?.data?.[0]?.url;
                if (url) {
                    const imgBuf = await axios.get(url, { responseType: 'arraybuffer', timeout: 10000 }).catch(() => null);
                    if (imgBuf) return sock.sendMessage(jid, { image: Buffer.from(imgBuf.data), caption: fmt(`📷 Unsplash: ${query}`), contextInfo }, { quoted: message });
                }
                return send(`📷 *Unsplash: "${query}"*\n\n🔗 https://unsplash.com/s/photos/${encodeURIComponent(query)}`);
            }
            return;
        }

        if (cmd === 'wallpapers') {
            const q = query || 'nature 4k';
            try {
                const res = await axios.get(`https://api.siputzx.my.id/api/search/image?q=${encodeURIComponent(q + ' wallpaper 4k')}`, { timeout: 15000 });
                const imgs = res.data?.data?.slice(0, 3) || [];
                if (!imgs.length) return send(`🖼️ No wallpapers found for: *${q}*`);
                for (const img of imgs.slice(0, 2)) {
                    const url = img?.url || img?.link;
                    if (url) {
                        try {
                            const imgRes = await axios.get(url, { responseType: 'arraybuffer', timeout: 10000 });
                            await sock.sendMessage(jid, { image: Buffer.from(imgRes.data), caption: fmt(`🖼️ Wallpaper: ${q}`), contextInfo }, { quoted: message });
                        } catch {}
                    }
                }
            } catch {
                return send(`🖼️ *Wallpapers: "${q}"*\n\n🔗 https://www.pexels.com/search/${encodeURIComponent(q)}/`);
            }
            return;
        }

        if (cmd === 'wattpad') {
            try {
                const res = await axios.get(`https://www.wattpad.com/api/v3/stories?query=${encodeURIComponent(query)}&limit=5&fields=id,title,description,mainCategory,readCount`, { timeout: 10000 });
                const stories = res.data?.stories || [];
                if (!stories.length) return send(`📚 No Wattpad stories found for: *${query}*`);
                const list = stories.map((s, i) =>
                    `*${i + 1}.* ${s.title}\n   📖 ${s.mainCategory || 'Fiction'} | 👁 ${(s.readCount || 0).toLocaleString()} reads\n   ${s.description?.slice(0, 80) || ''}`
                ).join('\n\n');
                return send(`📚 *Wattpad: "${query}"*\n\n${list}\n\n🔗 https://www.wattpad.com/stories/${encodeURIComponent(query)}`);
            } catch {
                return send(`📚 *Wattpad: "${query}"*\n\n🔗 https://www.wattpad.com/stories/${encodeURIComponent(query)}`);
            }
        }

        if (cmd === 'yts') {
            try {
                const res = await axios.get(`https://api.siputzx.my.id/api/search/youtube?q=${encodeURIComponent(query)}`, { timeout: 15000 });
                const items = res.data?.data?.slice(0, 5) || [];
                if (!items.length) return send(`▶️ No YouTube results for: *${query}*`);
                const list = items.map((v, i) =>
                    `*${i + 1}.* ${v.title}\n   ⏱ ${v.duration || 'N/A'} | 👁 ${v.views || 'N/A'}\n   🔗 ${v.url || `https://youtube.com/watch?v=${v.videoId}`}`
                ).join('\n\n');
                return send(`▶️ *YouTube: "${query}"*\n\n${list}`);
            } catch {
                return send(`▶️ *YouTube: "${query}"*\n\n🔗 https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`);
            }
        }

        if (cmd === 'spotifysearch') {
            try {
                const res = await axios.get(`https://api.siputzx.my.id/api/search/spotify?q=${encodeURIComponent(query)}`, { timeout: 15000 });
                const tracks = res.data?.data?.slice(0, 5) || [];
                if (!tracks.length) return send(`🎵 No Spotify results for: *${query}*`);
                const list = tracks.map((t, i) =>
                    `*${i + 1}.* ${t.title || t.name}\n   🎤 ${t.artist || t.artists?.join(', ') || 'Unknown'}\n   💿 ${t.album || 'N/A'}`
                ).join('\n\n');
                return send(`🎵 *Spotify: "${query}"*\n\n${list}\n\n🔗 https://open.spotify.com/search/${encodeURIComponent(query)}`);
            } catch {
                return send(`🎵 *Spotify: "${query}"*\n\n🔗 https://open.spotify.com/search/${encodeURIComponent(query)}`);
            }
        }
    }
};

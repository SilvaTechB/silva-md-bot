'use strict';

const axios  = require('axios');
const playdl = require('play-dl');
const { fmt } = require('../lib/theme');

// Dead APIs removed (2026-06): siputzx (all search endpoints), unsplash anon key (no quota)
// Replacements: DuckDuckGo instant answers for google, play-dl for YouTube search

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
                // DuckDuckGo Instant Answers API — confirmed working 2026-06
                const res = await axios.get(
                    `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`,
                    { timeout: 10000 }
                );
                const d = res.data;
                const abstract = d?.AbstractText || d?.Answer || '';
                const topics = (d?.RelatedTopics || [])
                    .filter(t => t.Text && t.FirstURL)
                    .slice(0, 5);

                if (!abstract && !topics.length) throw new Error('no results');

                let text = `🔍 *Google / DuckDuckGo: "${query}"*\n\n`;
                if (abstract) text += `📝 ${abstract.slice(0, 300)}\n\n`;
                if (topics.length) {
                    text += topics.map((t, i) =>
                        `*${i + 1}.* ${t.Text?.slice(0, 100)}\n   🔗 ${t.FirstURL}`
                    ).join('\n\n');
                }
                return send(text);
            } catch {
                return send(
                    `🔍 *Google: "${query}"*\n\n` +
                    `🔗 https://google.com/search?q=${encodeURIComponent(query)}\n` +
                    `🔗 https://duckduckgo.com/?q=${encodeURIComponent(query)}`
                );
            }
        }

        if (cmd === 'npm') {
            try {
                const res = await axios.get(`https://registry.npmjs.org/${encodeURIComponent(query)}`, { timeout: 10000 });
                const d   = res.data;
                const latest = d?.['dist-tags']?.latest;
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
            return send(`📱 *APK Mirror: "${query}"*\n\n🔗 https://www.apkmirror.com/?post_type=app_release&searchtype=apk&s=${encodeURIComponent(query)}\n\n_Click to search on APKMirror_`);
        }

        if (cmd === 'happymod') {
            return send(`🎮 *HappyMod: "${query}"*\n\n🔗 https://www.happymod.com/search.html?q=${encodeURIComponent(query)}\n\n_Click to search HappyMod_`);
        }

        if (cmd === 'ggleimage') {
            // siputzx image search is dead — provide Google Images link
            return send(
                `🖼️ *Google Images: "${query}"*\n\n` +
                `🔗 https://www.google.com/images?q=${encodeURIComponent(query)}\n` +
                `🔗 https://www.pexels.com/search/${encodeURIComponent(query)}/\n\n` +
                `_Click a link to browse images online_`
            );
        }

        if (cmd === 'unsplash') {
            // Unsplash public API requires a valid app key; provide link fallback
            return send(
                `📷 *Unsplash: "${query}"*\n\n` +
                `🔗 https://unsplash.com/s/photos/${encodeURIComponent(query)}\n\n` +
                `_Browse high-quality free photos on Unsplash_`
            );
        }

        if (cmd === 'wallpapers') {
            const q = query || 'nature 4k';
            return send(
                `🖼️ *Wallpapers: "${q}"*\n\n` +
                `🔗 https://www.pexels.com/search/${encodeURIComponent(q)}/\n` +
                `🔗 https://unsplash.com/s/photos/${encodeURIComponent(q)}\n` +
                `🔗 https://wallhaven.cc/search?q=${encodeURIComponent(q)}\n\n` +
                `_Click a link to browse wallpapers_`
            );
        }

        if (cmd === 'wattpad') {
            try {
                const res = await axios.get(
                    `https://www.wattpad.com/api/v3/stories?query=${encodeURIComponent(query)}&limit=5&fields=id,title,description,mainCategory,readCount`,
                    { timeout: 10000 }
                );
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
                // play-dl YouTube search — no external API key needed
                const results = await playdl.search(query, { source: { youtube: 'video' }, limit: 5 });
                if (!results?.length) return send(`▶️ No YouTube results for: *${query}*`);
                const list = results.map((v, i) =>
                    `*${i + 1}.* ${v.title}\n   ⏱ ${v.durationRaw || 'N/A'} | 👤 ${v.channel?.name || 'N/A'}\n   🔗 ${v.url}`
                ).join('\n\n');
                return send(`▶️ *YouTube: "${query}"*\n\n${list}`);
            } catch {
                return send(`▶️ *YouTube: "${query}"*\n\n🔗 https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`);
            }
        }

        if (cmd === 'spotifysearch') {
            // Spotify search API requires OAuth — provide link instead
            return send(
                `🎵 *Spotify: "${query}"*\n\n` +
                `🔗 https://open.spotify.com/search/${encodeURIComponent(query)}\n\n` +
                `_Click to search on Spotify_\n` +
                `_To download a song as audio, use: \`.spotify ${query}\`_`
            );
        }
    }
};

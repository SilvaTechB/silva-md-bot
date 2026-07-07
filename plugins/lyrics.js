'use strict';
const axios = require('axios');

// lyrics.ovh is dead (ECONNREFUSED / no response) — removed.
// Using some-random-api.com/lyrics (confirmed working 2026) as primary.
// Fallback: provide Genius/AZLyrics search links.

module.exports = {
    commands:    ['lyrics', 'lyric'],
    description: 'Search song lyrics by artist and title',
    usage:       '.lyrics <artist> - <song>',
    permission:  'public',
    group:       true,
    private:     true,

    run: async (sock, message, args, ctx) => {
        const { contextInfo } = ctx;
        const jid = message.key.remoteJid;
        if (!args.length) {
            return sock.sendMessage(jid, {
                text: `❌ *Usage:* \`.lyrics <artist> - <song>\`\n\n_Example:_ \`.lyrics Drake - God's Plan\``,
                contextInfo
            }, { quoted: message });
        }
        const query  = args.join(' ');
        const sep    = query.includes(' - ') ? query.split(' - ') : [null, query];
        const artist = sep[0]?.trim() || '';
        const title  = sep[1]?.trim() || sep[0]?.trim() || query;
        const searchQ = artist ? `${artist} ${title}` : title;

        await sock.sendPresenceUpdate('composing', jid);

        // Strategy 1: some-random-api.com/lyrics
        try {
            const res = await axios.get(
                `https://some-random-api.com/lyrics?title=${encodeURIComponent(searchQ)}`,
                { headers: { 'User-Agent': 'SilvaMD-Bot/2.0' }, timeout: 12000 }
            );
            const d   = res.data;
            const raw = d?.lyrics;
            if (!raw || raw.length < 10) throw new Error('empty');
            const lyrics  = raw.trim().slice(0, 3500);
            const trunc   = raw.length > 3500 ? '\n_[…truncated]_' : '';
            const trackTitle  = d?.title  || title;
            const trackArtist = d?.author || artist || 'Unknown';
            return sock.sendMessage(jid, {
                text: `🎵 *${trackTitle}* — ${trackArtist}\n\n${lyrics}${trunc}`,
                contextInfo
            }, { quoted: message });
        } catch {}

        // Strategy 2: genius.com unofficial search scrape
        try {
            const q   = searchQ.replace(/\s+/g, '-').toLowerCase().replace(/[^a-z0-9-]/g, '');
            const res = await axios.get(`https://genius.com/api/search/song?q=${encodeURIComponent(searchQ)}&per_page=1`, {
                headers: { 'User-Agent': 'Mozilla/5.0', 'X-Genius-iOS-Version': '6.4.0' },
                timeout: 8000
            });
            const hit = res.data?.response?.sections?.[0]?.hits?.[0]?.result;
            if (hit?.url) {
                const page = await axios.get(hit.url, {
                    headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 10000
                });
                const match = page.data?.match(/<div[^>]*data-lyrics-container[^>]*>([\s\S]*?)<\/div>/g);
                if (match?.length) {
                    const raw = match.join('\n').replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').trim();
                    if (raw.length > 20) {
                        const lyrics = raw.slice(0, 3500);
                        const trunc  = raw.length > 3500 ? '\n_[…truncated]_' : '';
                        return sock.sendMessage(jid, {
                            text: `🎵 *${hit.title || title}* — ${hit.primary_artist?.name || artist || 'Unknown'}\n\n${lyrics}${trunc}`,
                            contextInfo
                        }, { quoted: message });
                    }
                }
            }
        } catch {}

        // Fallback: search links
        const geniusQ   = encodeURIComponent(searchQ);
        const azQ       = encodeURIComponent(searchQ.toLowerCase().replace(/\s+/g, '+'));
        await sock.sendMessage(jid, {
            text:
                `🎵 *Lyrics: "${searchQ}"*\n\n` +
                `Couldn't retrieve lyrics automatically. Search here:\n\n` +
                `🔗 Genius: https://genius.com/search?q=${geniusQ}\n` +
                `🔗 AZLyrics: https://www.azlyrics.com/lyrics.html?q=${azQ}\n` +
                `🔗 Musixmatch: https://www.musixmatch.com/search/${geniusQ}`,
            contextInfo
        }, { quoted: message });
    }
};

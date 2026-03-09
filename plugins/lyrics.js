'use strict';
const axios = require('axios');

module.exports = {
    commands:    ['lyrics', 'lyric'],
    description: 'Search song lyrics by artist and title',
    usage:       '.lyrics <artist> - <song>  e.g. .lyrics Drake - God\'s Plan',
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
        const query = args.join(' ');
        const sep   = query.includes(' - ') ? query.split(' - ') : [null, query];
        const artist = sep[0]?.trim() || 'unknown';
        const title  = sep[1]?.trim() || sep[0]?.trim() || query;

        try {
            const url = `https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`;
            const res  = await axios.get(url, { timeout: 12000 });
            const lyricsRaw = res.data?.lyrics;
            if (!lyricsRaw) throw new Error('Not found');
            const lyrics = lyricsRaw.trim().slice(0, 3500);
            const truncNote = lyricsRaw.length > 3500 ? '\n\n_[truncated — too long to display]_' : '';
            await sock.sendMessage(jid, {
                text: `🎵 *${title}* — ${artist}\n\n${lyrics}${truncNote}\n\n> _Powered by Silva MD_`,
                contextInfo
            }, { quoted: message });
        } catch {
            await sock.sendMessage(jid, {
                text: `❌ Lyrics not found for *"${title}"* by *${artist}*.\n\nMake sure you format it as: \`.lyrics Artist - Song Title\``,
                contextInfo
            }, { quoted: message });
        }
    }
};

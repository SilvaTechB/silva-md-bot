'use strict';
const axios = require('axios');

module.exports = {
    commands:    ['spotify', 'spoti', 'spdl'],
    description: 'Search Spotify track info and download audio',
    permission:  'public',
    group:       true,
    private:     true,
    run: async (sock, message, args, { sender, contextInfo }) => {
        const query = args.join(' ');
        if (!query) {
            return sock.sendMessage(sender, {
                text: '🎵 Please provide a song name.\nExample: .spotify Blinding Lights',
                contextInfo
            }, { quoted: message });
        }
        await sock.sendMessage(sender, { text: '⏳ Searching Spotify...', contextInfo }, { quoted: message });
        try {
            const api = `https://api.nexoracle.com/downloaders/spotify?query=${encodeURIComponent(query)}&apikey=free_for_use`;
            const { data } = await axios.get(api, { timeout: 25000, headers: { 'User-Agent': 'Mozilla/5.0' } });
            const result = data?.result || data?.data;
            if (!result) throw new Error('No results found.');
            const audioUrl = result.audio || result.download || result.url;
            const coverUrl = result.thumbnail || result.image;
            const name     = result.name || result.title || query;
            const artist   = result.artist || result.artists || 'Unknown';
            const caption  = `🎵 *${name}*\n👤 ${artist}\n_Powered by Silva MD_`;
            if (audioUrl) {
                await sock.sendMessage(sender, {
                    audio:    { url: audioUrl },
                    mimetype: 'audio/mpeg',
                    ptt:      false,
                    contextInfo
                }, { quoted: message });
            }
            await sock.sendMessage(sender, {
                image:   { url: coverUrl || 'https://files.catbox.moe/5uli5p.jpeg' },
                caption,
                contextInfo
            }, { quoted: message });
        } catch (e) {
            await sock.sendMessage(sender, { text: `❌ Spotify search failed: ${e.message}`, contextInfo }, { quoted: message });
        }
    }
};

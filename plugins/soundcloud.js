'use strict';
const axios = require('axios');

module.exports = {
    commands:    ['soundcloud', 'scdl', 'sc'],
    description: 'Download SoundCloud audio',
    permission:  'public',
    group:       true,
    private:     true,
    run: async (sock, message, args, { sender, contextInfo }) => {
        const url = args[0];
        if (!url || !url.includes('soundcloud.com')) {
            return sock.sendMessage(sender, {
                text: '🎵 Please provide a valid SoundCloud URL.\nExample: .sc https://soundcloud.com/artist/track',
                contextInfo
            }, { quoted: message });
        }
        await sock.sendMessage(sender, { text: '⏳ Downloading SoundCloud audio...', contextInfo }, { quoted: message });
        try {
            const api = `https://api.nexoracle.com/downloaders/soundcloud?url=${encodeURIComponent(url)}&apikey=free_for_use`;
            const { data } = await axios.get(api, { timeout: 25000, headers: { 'User-Agent': 'Mozilla/5.0' } });
            const result = data?.result || data?.data;
            if (!result) throw new Error('No audio found.');
            const audioUrl = result.audio || result.download || result.url;
            if (!audioUrl) throw new Error('Could not extract audio URL.');
            await sock.sendMessage(sender, {
                audio:    { url: audioUrl },
                mimetype: 'audio/mpeg',
                ptt:      false,
                contextInfo
            }, { quoted: message });
            await sock.sendMessage(sender, {
                text: `🎵 *${result.title || 'SoundCloud Track'}*\n👤 ${result.author || 'Unknown'}\n_Powered by Silva MD_`,
                contextInfo
            }, { quoted: message });
        } catch (e) {
            await sock.sendMessage(sender, { text: `❌ SoundCloud download failed: ${e.message}`, contextInfo }, { quoted: message });
        }
    }
};

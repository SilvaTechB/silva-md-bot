'use strict';
const axios = require('axios');

// nexoracle.com returns bot-protection HTML — removed.
// Trying scdl.vercel.app (public no-key API) as primary.

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
                text: '🎵 Please provide a valid SoundCloud URL.\nExample: `.sc https://soundcloud.com/artist/track`',
                contextInfo
            }, { quoted: message });
        }
        await sock.sendMessage(sender, { text: '⏳ Downloading SoundCloud audio...', contextInfo }, { quoted: message });

        const strategies = [
            // Strategy 1: soundcloudmp3.io public endpoint
            async () => {
                const res = await axios.get(
                    `https://soundcloudmp3.io/api/soundcloud?url=${encodeURIComponent(url)}`,
                    { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 20000 }
                );
                const d = res.data;
                const audioUrl = d?.url || d?.download_url || d?.audio;
                if (!audioUrl) throw new Error('no url');
                return { audioUrl, title: d?.title || 'SoundCloud Track', author: d?.artist || 'Unknown' };
            },
            // Strategy 2: api.fabdl.com
            async () => {
                const res = await axios.get(
                    `https://api.fabdl.com/soundcloud/get?url=${encodeURIComponent(url)}`,
                    { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 20000 }
                );
                const d = res.data?.result;
                const audioUrl = d?.download_url || d?.url;
                if (!audioUrl) throw new Error('no url');
                return { audioUrl, title: d?.title || 'SoundCloud Track', author: d?.artist || 'Unknown' };
            },
        ];

        for (const strat of strategies) {
            try {
                const { audioUrl, title, author } = await strat();
                await sock.sendMessage(sender, {
                    audio: { url: audioUrl }, mimetype: 'audio/mpeg', ptt: false, contextInfo
                }, { quoted: message });
                await sock.sendMessage(sender, {
                    text: `🎵 *${title}*\n👤 ${author}\n_Powered by Silva MD_`, contextInfo
                }, { quoted: message });
                return;
            } catch {}
        }

        await sock.sendMessage(sender, {
            text:
                `❌ *SoundCloud Download Failed*\n\n` +
                `Use one of these free tools instead:\n\n` +
                `🔗 https://soundcloudmp3.io\n` +
                `🔗 https://www.klickaud.co\n\n` +
                `_Paste your SoundCloud link there_`,
            contextInfo
        }, { quoted: message });
    }
};

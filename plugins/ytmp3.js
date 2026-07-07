'use strict';

const axios  = require('axios');
const playdl = require('play-dl');

const BASE = 'https://apis.davidcyriltech.my.id';

module.exports = {
    commands:    ['ytmp3', 'ytvid-audio', 'ytaudio2'],
    description: 'Download YouTube audio as MP3 by URL',
    permission:  'public',
    group:       true,
    private:     true,

    run: async (sock, message, args, { sender, contextInfo }) => {
        const url = args[0];
        if (!url || !/^https?:\/\/(www\.)?(youtube\.com|youtu\.be)/.test(url)) {
            return sock.sendMessage(sender, {
                text: '🎵 Please provide a valid YouTube URL.\nExample: `.ytmp3 https://youtu.be/dQw4w9WgXcQ`',
                contextInfo
            }, { quoted: message });
        }

        await sock.sendMessage(sender, { text: '⏳ Fetching audio...', contextInfo }, { quoted: message });

        try {
            let title = 'Audio', artist = 'Unknown', duration = '';
            try {
                const info = await playdl.video_info(url);
                const d = info.video_details;
                title    = d.title || title;
                artist   = d.channel?.name || artist;
                duration = d.durationRaw || '';
            } catch {}

            const { data } = await axios.get(`${BASE}/download/ytmp3?url=${encodeURIComponent(url)}`, { timeout: 30000 });
            const audioUrl = data?.result?.download_url || data?.result?.downloadUrl || data?.result?.url || data?.url || data?.link;
            if (!audioUrl) throw new Error('Could not retrieve download link');

            await sock.sendMessage(sender, {
                audio:    { url: audioUrl },
                mimetype: 'audio/mpeg',
                ptt:      false,
                contextInfo
            }, { quoted: message });

            await sock.sendMessage(sender, {
                text: `🎵 *${title}*\n🎤 ${artist}  •  ⏱ ${duration}`,
                contextInfo
            }, { quoted: message });

        } catch (err) {
            await sock.sendMessage(sender, {
                text: `❌ Audio download failed: ${err.message}`,
                contextInfo
            }, { quoted: message });
        }
    }
};

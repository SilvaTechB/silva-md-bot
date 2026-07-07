'use strict';

const axios  = require('axios');
const playdl = require('play-dl');

const BASE = 'https://apis.davidcyriltech.my.id';

module.exports = {
    commands:    ['ytmp4', 'ytvideo', 'ytv', 'yt', 'youtube'],
    description: 'Download YouTube video (up to 10 min)',
    permission:  'public',
    group:       true,
    private:     true,

    run: async (sock, message, args, { sender, contextInfo }) => {
        const url = args[0];
        if (!url || !/^https?:\/\/(www\.)?(youtube\.com|youtu\.be)/.test(url)) {
            return sock.sendMessage(sender, {
                text: '🎬 Please provide a valid YouTube URL.\nExample: `.ytmp4 https://youtu.be/dQw4w9WgXcQ`',
                contextInfo
            }, { quoted: message });
        }

        await sock.sendMessage(sender, { text: '⏳ Fetching video...', contextInfo }, { quoted: message });

        try {
            let title = 'Video', artist = 'Unknown', duration = '', durationSec = 0;
            try {
                const info = await playdl.video_info(url);
                const d = info.video_details;
                title       = d.title || title;
                artist      = d.channel?.name || artist;
                duration    = d.durationRaw || '';
                durationSec = d.durationInSec || 0;
            } catch {}

            if (durationSec > 600) {
                return sock.sendMessage(sender, {
                    text: '❌ Video too long (max 10 minutes). Use `.play` for audio only.',
                    contextInfo
                }, { quoted: message });
            }

            const { data } = await axios.get(`${BASE}/download/ytmp4?url=${encodeURIComponent(url)}`, { timeout: 30000 });
            const videoUrl = data?.result?.download_url || data?.result?.downloadUrl || data?.result?.url || data?.url || data?.link;
            if (!videoUrl) throw new Error('Could not retrieve download link');

            await sock.sendMessage(sender, {
                video:   { url: videoUrl },
                caption: `▶️ *${title}*\n👤 ${artist}  •  ⏱ ${duration}`,
                contextInfo
            }, { quoted: message });

        } catch (err) {
            await sock.sendMessage(sender, {
                text: `❌ Video download failed: ${err.message}`,
                contextInfo
            }, { quoted: message });
        }
    }
};

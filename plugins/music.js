'use strict';

const playdl = require('play-dl');
const axios  = require('axios');

const FALLBACK_APIS = (link) => [
    `https://apiskeith.top/download/audio?url=${encodeURIComponent(link)}`,
    `https://api.siputzx.my.id/api/d/ytmp3?url=${encodeURIComponent(link)}`,
    `https://api.davidcyriltech.my.id/download/ytmp3?url=${encodeURIComponent(link)}`,
    `https://api.akuari.my.id/downloader/youtubeaudio?link=${encodeURIComponent(link)}`
];

module.exports = {
    commands:    ['play', 'music'],
    description: 'Search and download a song from YouTube',
    permission:  'public',
    group:       true,
    private:     true,

    run: async (sock, message, args, { sender, contextInfo }) => {
        const query = args.join(' ').trim();
        if (!query) {
            return sock.sendMessage(sender, {
                text: '❌ Usage: `.play <song name or YouTube link>`',
                contextInfo
            }, { quoted: message });
        }

        const wait = await sock.sendMessage(sender, {
            text: `🔍 Searching: *${query}*...`,
            contextInfo
        }, { quoted: message });

        try {
            // ── Step 1: resolve YouTube URL ──────────────────────────────
            let videoUrl, title, artist, thumbnail, duration;

            const isUrl = /^https?:\/\/(www\.)?(youtube\.com|youtu\.be)/.test(query);

            if (isUrl) {
                const info = await playdl.video_info(query);
                const det  = info.video_details;
                videoUrl  = query;
                title     = det.title || 'Unknown Title';
                artist    = det.channel?.name || 'Unknown Artist';
                thumbnail = det.thumbnails?.[det.thumbnails.length - 1]?.url || '';
                duration  = det.durationRaw || '';
            } else {
                const results = await playdl.search(query, { source: { youtube: 'video' }, limit: 1 });
                if (!results?.length) throw new Error('No results found');
                const v = results[0];
                videoUrl  = v.url;
                title     = v.title || 'Unknown Title';
                artist    = v.channel?.name || 'Unknown Artist';
                thumbnail = v.thumbnails?.[v.thumbnails.length - 1]?.url || '';
                duration  = v.durationRaw || '';
            }

            // ── Step 2: send info card ────────────────────────────────────
            await sock.sendMessage(sender, {
                image:   { url: thumbnail || 'https://files.catbox.moe/5uli5p.jpeg' },
                caption:
                    `🎵 *${title}*\n` +
                    `🎤 *Artist:* ${artist}\n` +
                    `⏱ *Duration:* ${duration}\n\n` +
                    `_Downloading audio..._`,
                contextInfo
            }, { quoted: message });

            // ── Step 3: try play-dl stream first ─────────────────────────
            let audioBuffer = null;
            try {
                const stream = await playdl.stream(videoUrl, { quality: 2 });
                const chunks = [];
                for await (const chunk of stream.stream) chunks.push(chunk);
                audioBuffer = Buffer.concat(chunks);
            } catch (streamErr) {
                console.warn('[Music] play-dl stream failed:', streamErr.message, '— trying APIs');
            }

            // ── Step 4: fallback to public APIs ───────────────────────────
            let audioUrl = null;
            if (!audioBuffer) {
                for (const url of FALLBACK_APIS(videoUrl)) {
                    try {
                        const { data } = await axios.get(url, { timeout: 25000 });
                        const dl =
                            (typeof data?.result === 'string' ? data.result : null) ||
                            data?.result?.downloadUrl ||
                            data?.result?.url ||
                            data?.download ||
                            data?.url ||
                            data?.link;
                        if (dl) { audioUrl = dl; break; }
                    } catch { /* next */ }
                }
            }

            if (!audioBuffer && !audioUrl) {
                throw new Error('All download methods failed. Try again later.');
            }

            // ── Step 5: send audio ────────────────────────────────────────
            const audioPayload = audioBuffer
                ? { audio: audioBuffer, mimetype: 'audio/mpeg' }
                : { audio: { url: audioUrl }, mimetype: 'audio/mpeg' };

            await sock.sendMessage(sender, { ...audioPayload, contextInfo }, { quoted: message });

            // ── Step 6: send as downloadable file ────────────────────────
            const safeTitle = title.replace(/[^\w\s-]/g, '').trim().slice(0, 50);
            const docPayload = audioBuffer
                ? { document: audioBuffer, mimetype: 'audio/mpeg', fileName: `${safeTitle}.mp3` }
                : { document: { url: audioUrl }, mimetype: 'audio/mpeg', fileName: `${safeTitle}.mp3` };

            await sock.sendMessage(sender, { ...docPayload, contextInfo }, { quoted: message });

        } catch (err) {
            await sock.sendMessage(sender, {
                text: `❌ *Could not download:* ${err.message}`,
                contextInfo
            }, { quoted: message });
        }
    }
};

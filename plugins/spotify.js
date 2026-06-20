'use strict';

const axios  = require('axios');
const playdl = require('play-dl');

// nexoracle.com returns HTML (bot protection), not a usable API — removed.
// saavn.dev / jiosaavn API mirrors are all dead (ENOTFOUND / 400).
// Strategy: search YouTube via play-dl, download MP3 via davidcyriltech.

const DC_BASE = 'https://apis.davidcyriltech.my.id';

module.exports = {
    commands:    ['spotify', 'spoti', 'spdl'],
    description: 'Search and download a song as audio (via YouTube)',
    permission:  'public',
    group:       true,
    private:     true,

    run: async (sock, message, args, { sender, contextInfo }) => {
        const query = args.join(' ').trim();
        if (!query) {
            return sock.sendMessage(sender, {
                text: '🎵 Please provide a song name.\nExample: `.spotify Blinding Lights`',
                contextInfo
            }, { quoted: message });
        }

        const loading = await sock.sendMessage(sender, {
            text: `⏳ _Searching for_ *${query}*_..._`,
            contextInfo
        }, { quoted: message }).catch(() => null);
        const deleteLoading = () => {
            if (loading?.key) sock.sendMessage(sender, { delete: loading.key }).catch(() => {});
        };

        try {
            // 1. Search YouTube for the song (play-dl — no external API)
            const results = await playdl.search(query + ' audio', {
                source: { youtube: 'video' },
                limit:  1
            });
            const first = results?.[0];
            if (!first?.url) throw new Error(`No results found for: ${query}`);

            const title    = first.title || query;
            const channel  = first.channel?.name || 'Unknown Artist';
            const duration = first.durationRaw || 'N/A';
            const thumb    = first.thumbnails?.[first.thumbnails.length - 1]?.url || '';

            // 2. Download MP3 via davidcyriltech (confirmed live 2026-06)
            const dlRes = await axios.get(
                `${DC_BASE}/download/ytmp3?url=${encodeURIComponent(first.url)}`,
                { timeout: 35000 }
            );
            const audioUrl = dlRes.data?.result?.download_url || dlRes.data?.result?.downloadUrl
                           || dlRes.data?.result?.url || dlRes.data?.url || dlRes.data?.link;
            if (!audioUrl) throw new Error('Could not retrieve download link');

            await deleteLoading();

            // 3. Send audio
            await sock.sendMessage(sender, {
                audio:    { url: audioUrl },
                mimetype: 'audio/mpeg',
                ptt:      false,
                contextInfo
            }, { quoted: message });

            // 4. Send cover art + caption
            const caption = `🎵 *${title}*\n👤 ${channel}  •  ⏱ ${duration}\n_Powered by Silva MD_`;
            if (thumb) {
                await sock.sendMessage(sender, {
                    image: { url: thumb }, caption, contextInfo
                }, { quoted: message });
            } else {
                await sock.sendMessage(sender, { text: caption, contextInfo }, { quoted: message });
            }
        } catch (e) {
            await deleteLoading();
            await sock.sendMessage(sender, {
                text: `❌ Song download failed: ${String(e.message).slice(0, 100)}\n\n_Try: \`.ytmp3 <youtube url>\` with a direct URL_`,
                contextInfo
            }, { quoted: message });
        }
    }
};

'use strict';

const axios = require('axios');

module.exports = {
    commands:    ['anime', 'animesearch', 'manga'],
    description: 'Search for anime or manga info from MyAnimeList',
    usage:       '.anime Naruto | .manga One Piece',
    permission:  'public',
    group:       true,
    private:     true,

    run: async (sock, message, args, ctx) => {
        const { jid, contextInfo } = ctx;

        const rawCmd = (message.message?.extendedTextMessage?.text
            || message.message?.conversation || '').trim().split(/\s+/)[0].replace(/^\./, '').toLowerCase();

        const query = args.join(' ').trim();
        if (!query) {
            return sock.sendMessage(jid, {
                text: `❌ Provide a title to search.\n\nExamples:\n• \`.anime Naruto\`\n• \`.manga One Piece\``,
                contextInfo
            }, { quoted: message });
        }

        const type = rawCmd === 'manga' ? 'manga' : 'anime';

        try {
            await sock.sendPresenceUpdate('composing', jid);

            const resp = await axios.get(`https://api.jikan.moe/v4/${type}`, {
                params: { q: query, limit: 1, sfw: true },
                timeout: 12000
            });

            const item = resp.data?.data?.[0];
            if (!item) {
                return sock.sendMessage(jid, { text: `❌ No results found for "*${query}*".`, contextInfo }, { quoted: message });
            }

            const title   = item.title_english || item.title;
            const japanese = item.title_japanese || '';
            const score   = item.score ? `⭐ ${item.score}/10` : 'N/A';
            const status  = item.status || 'Unknown';
            const eps     = item.episodes ? `${item.episodes} episodes` : (item.chapters ? `${item.chapters} chapters` : 'Ongoing');
            const genres  = (item.genres || []).map(g => g.name).join(', ') || 'N/A';
            const aired   = item.aired?.string || item.published?.string || 'Unknown';
            const synopsis = (item.synopsis || 'No synopsis available.').replace(/\[Written by.*?\]/gi, '').trim();
            const truncSynopsis = synopsis.length > 400 ? synopsis.slice(0, 400) + '…' : synopsis;
            const url     = item.url || '';

            const text = [
                `🎌 *${title}*`,
                japanese ? `_(${japanese})_` : '',
                ``,
                `📊 *Score:* ${score}`,
                `📺 *Status:* ${status}`,
                `🎬 *Episodes/Chapters:* ${eps}`,
                `🎭 *Genres:* ${genres}`,
                `📅 *Aired:* ${aired}`,
                ``,
                `📝 *Synopsis:*`,
                truncSynopsis,
                ``,
                url ? `🔗 ${url}` : ''
            ].filter(Boolean).join('\n');

            // Try to send with cover image, fall back to text-only
            try {
                const imageUrl = item.images?.jpg?.large_image_url || item.images?.jpg?.image_url;
                if (imageUrl) {
                    const imgResp = await axios.get(imageUrl, { responseType: 'arraybuffer', timeout: 10000 });
                    await sock.sendMessage(jid, {
                        image:   Buffer.from(imgResp.data),
                        caption: text,
                        contextInfo
                    }, { quoted: message });
                    return;
                }
            } catch { /* fall through to text */ }

            await sock.sendMessage(jid, { text, contextInfo }, { quoted: message });

        } catch (e) {
            await sock.sendMessage(jid, {
                text: `❌ Search failed: ${e.message}`,
                contextInfo
            }, { quoted: message });
        }
    }
};

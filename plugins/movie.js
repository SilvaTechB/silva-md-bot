'use strict';
const axios = require('axios');
const { fmt } = require('../lib/theme');

module.exports = {
    commands:    ['movie', 'film', 'imdb', 'series'],
    description: 'Search for movie or TV series info (OMDB)',
    usage:       '.movie [title]  |  .movie [title] [year]',
    permission:  'public',
    group:       true,
    private:     true,

    run: async (sock, message, args, ctx) => {
        const { jid, contextInfo } = ctx;
        const reply = (text) => sock.sendMessage(jid, { text: fmt(text), contextInfo }, { quoted: message });

        if (!args.length) return reply('❌ *Usage:* `.movie [title]`\n\nExample: `.movie Avengers Endgame`');

        // Last arg treated as year if it's 4 digits
        let year = '';
        let titleArgs = [...args];
        if (/^\d{4}$/.test(titleArgs[titleArgs.length - 1])) year = titleArgs.pop();

        const title = titleArgs.join(' ').trim();

        try {
            // Use free OMDB API (no key needed for basic search)
            const params = { t: title, plot: 'short', r: 'json' };
            if (year) params.y = year;

            const res  = await axios.get('https://www.omdbapi.com/', { params: { ...params, apikey: 'trilogy' }, timeout: 10000 });
            const data = res.data;

            if (data.Response === 'False') {
                // Try a search query instead
                const sRes  = await axios.get('https://www.omdbapi.com/', {
                    params: { s: title, r: 'json', apikey: 'trilogy' },
                    timeout: 10000
                });
                const hits = sRes.data?.Search;
                if (!hits?.length) return reply(`❌ No results found for *"${title}"*`);

                const list = hits.slice(0, 5).map((h, i) => `${i + 1}. ${h.Title} (${h.Year}) — ${h.Type}`).join('\n');
                return reply(`🎬 *Search Results for "${title}"*\n\n${list}\n\n_Try_ \`.movie [exact title]\` _for full details._`);
            }

            const ratings = (data.Ratings || []).map(r => `• ${r.Source}: ${r.Value}`).join('\n');

            const lines = [
                `🎬 *${data.Title}* (${data.Year})`,
                ``,
                `📺 Type: ${data.Type?.charAt(0).toUpperCase() + data.Type?.slice(1) || 'N/A'}`,
                `🎭 Genre: ${data.Genre || 'N/A'}`,
                `🌍 Language: ${data.Language || 'N/A'}`,
                `🌐 Country: ${data.Country || 'N/A'}`,
                `⏱️ Runtime: ${data.Runtime || 'N/A'}`,
                `📅 Released: ${data.Released || data.Year}`,
                ``,
                `🎬 Director: ${data.Director || 'N/A'}`,
                `✍️ Writer: ${data.Writer || 'N/A'}`,
                `🎭 Cast: ${data.Actors || 'N/A'}`,
                ``,
                `📝 *Plot:*`,
                data.Plot || 'N/A',
            ];

            if (ratings) lines.push('', `⭐ *Ratings:*`, ratings);
            if (data.Awards && data.Awards !== 'N/A') lines.push('', `🏆 *Awards:* ${data.Awards}`);
            if (data.BoxOffice && data.BoxOffice !== 'N/A') lines.push(`💰 Box Office: ${data.BoxOffice}`);
            if (data.imdbID) lines.push('', `🔗 IMDB: https://imdb.com/title/${data.imdbID}`);

            return reply(lines.join('\n'));

        } catch (e) {
            return reply(`❌ Movie lookup failed: ${e.message}`);
        }
    }
};

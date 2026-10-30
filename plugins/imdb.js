'use strict';

const axios = require('axios');

function clean(value, fallback = 'N/A') {
    return String(value || fallback).replace(/[\r\n]+/g, ' ').trim();
}

module.exports = {
    commands: ['imdb', 'imdbsearch', 'movie'],
    description: 'Search IMDb titles, years, types, cast, and ratings',
    usage: '.imdb <movie or series title>',
    permission: 'public',
    group: true,
    private: true,

    run: async (sock, message, args, ctx) => {
        const query = args.join(' ').trim();
        if (!query) return ctx.reply('🎬 *IMDb Search*\n\nUsage: `.imdb <movie or series title>`\nExample: `.imdb Inception`');
        if (query.length > 120) return ctx.reply('❌ Please keep the title search under 120 characters.');

        try {
            const response = await axios.get(`https://v3.sg.media-imdb.com/suggestion/x/${encodeURIComponent(query)}.json`, {
                timeout: 10000,
                headers: { Accept: 'application/json', 'User-Agent': 'Silva-MD-Bot/1.0' }
            });
            const results = Array.isArray(response.data?.d) ? response.data.d
                .filter(item => item?.id && item?.l)
                .slice(0, 6) : [];
            if (!results.length) return ctx.reply(`❌ No IMDb titles found for: *${query}*`);

            const lines = results.map((item, index) => {
                const title = clean(item.l);
                const year = clean(item.y, 'Year unknown');
                const type = clean(item.q, 'title');
                const cast = clean(item.s, 'Cast unavailable');
                return `${index + 1}. *${title}* (${year})\n   ${type} • ${cast}\n   https://www.imdb.com/title/${item.id}/`;
            });
            return ctx.reply(`🎬 *IMDb Results for: ${query}*\n\n${lines.join('\n\n')}`);
        } catch (error) {
            console.warn(`[IMDb] search failed: ${error.message}`);
            return ctx.reply('❌ IMDb search is temporarily unavailable. Please try again shortly.');
        }
    }
};

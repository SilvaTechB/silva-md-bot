'use strict';
const axios = require('axios');
const { fmt } = require('../lib/theme');

const FEEDS = {
    world:    'https://feeds.bbci.co.uk/news/world/rss.xml',
    africa:   'https://feeds.bbci.co.uk/news/world/africa/rss.xml',
    tech:     'https://feeds.bbci.co.uk/news/technology/rss.xml',
    business: 'https://feeds.bbci.co.uk/news/business/rss.xml',
    sports:   'https://feeds.bbci.co.uk/sport/rss.xml',
    health:   'https://feeds.bbci.co.uk/news/health/rss.xml',
    science:  'https://feeds.bbci.co.uk/news/science_and_environment/rss.xml',
    kenya:    'https://www.standardmedia.co.ke/rss/headlines.php',
};

async function fetchRSS(url) {
    const res  = await axios.get(url, { timeout: 12000, headers: { 'User-Agent': 'SilvaMDBot/1.0' } });
    const xml  = res.data;
    const items = [...xml.matchAll(/<item[\s\S]*?<\/item>/gi)];
    return items.slice(0, 7).map(([item]) => {
        const title   = (item.match(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/) || [])[1]?.trim() || '';
        const link    = (item.match(/<link>([\s\S]*?)<\/link>/)  || [])[1]?.trim() || '';
        const pubDate = (item.match(/<pubDate>([\s\S]*?)<\/pubDate>/) || [])[1]?.trim() || '';
        return { title, link, pubDate };
    }).filter(i => i.title);
}

module.exports = {
    commands:    ['news', 'headlines', 'latestnews', 'breaking'],
    description: 'Latest news headlines by category',
    usage:       '.news [world|tech|africa|sports|business|health|science|kenya]',
    permission:  'public',
    group:       true,
    private:     true,

    run: async (sock, message, args, ctx) => {
        const { jid, contextInfo } = ctx;
        const reply = (text) => sock.sendMessage(jid, { text: fmt(text), contextInfo }, { quoted: message });

        const cat = (args[0] || 'world').toLowerCase().replace(/^#/, '');

        if (!FEEDS[cat]) {
            const cats = Object.keys(FEEDS).join(' | ');
            return reply(`❌ Unknown category: *${cat}*\n\nAvailable: ${cats}\n\nUsage: \`.news tech\``);
        }

        try {
            const articles = await fetchRSS(FEEDS[cat]);
            if (!articles.length) return reply('⚠️ No articles found right now. Try again in a moment.');

            const catLabel = cat.charAt(0).toUpperCase() + cat.slice(1);
            const lines = [`📰 *${catLabel} News — Top ${articles.length} Headlines*`, ''];

            articles.forEach((a, i) => {
                lines.push(`${i + 1}. ${a.title}`);
                if (a.link) lines.push(`   🔗 ${a.link}`);
                lines.push('');
            });

            lines.push(`_Source: BBC / Standard Media • ${new Date().toUTCString()}_`);

            return reply(lines.join('\n').trim());

        } catch (e) {
            return reply(`❌ Failed to fetch news: ${e.message}`);
        }
    }
};

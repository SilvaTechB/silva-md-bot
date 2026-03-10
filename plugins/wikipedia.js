'use strict';
const axios = require('axios');

module.exports = {
    commands:    ['wiki', 'wikipedia', 'search'],
    description: 'Search Wikipedia for any topic',
    usage:       '.wiki <topic>',
    permission:  'public',
    group:       true,
    private:     true,

    run: async (sock, message, args, ctx) => {
        const { contextInfo } = ctx;
        const jid = message.key.remoteJid;
        if (!args.length) {
            return sock.sendMessage(jid, {
                text: `❌ *Usage:* \`.wiki <topic>\`\n_Example:_ \`.wiki Black holes\``,
                contextInfo
            }, { quoted: message });
        }
        const query = args.join(' ');
        try {
            const searchRes = await axios.get('https://en.wikipedia.org/w/api.php', {
                params: { action: 'query', list: 'search', srsearch: query, format: 'json', srlimit: 1 },
                timeout: 10000
            });
            const title = searchRes.data?.query?.search?.[0]?.title;
            if (!title) throw new Error('No results');
            const summaryRes = await axios.get(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`, { timeout: 10000 });
            const { displaytitle, extract, thumbnail, content_urls } = summaryRes.data;
            const pageUrl = content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encodeURIComponent(title)}`;
            const summary = (extract || '').slice(0, 1200);
            const trunc   = (extract?.length || 0) > 1200 ? '\n_[…read more on Wikipedia]_' : '';
            if (thumbnail?.source) {
                await sock.sendMessage(jid, {
                    image:   { url: thumbnail.source },
                    caption: `📖 *${displaytitle}*\n\n${summary}${trunc}\n\n🔗 ${pageUrl}`,
                    contextInfo
                }, { quoted: message });
            } else {
                await sock.sendMessage(jid, {
                    text: `📖 *${displaytitle}*\n\n${summary}${trunc}\n\n🔗 ${pageUrl}`,
                    contextInfo
                }, { quoted: message });
            }
        } catch {
            await sock.sendMessage(jid, { text: `❌ Nothing found for *"${query}"*.`, contextInfo }, { quoted: message });
        }
    }
};

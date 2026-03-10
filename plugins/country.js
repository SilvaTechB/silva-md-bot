'use strict';
const axios = require('axios');

module.exports = {
    commands:    ['country', 'countryinfo'],
    description: 'Get detailed information about any country',
    usage:       '.country <name>',
    permission:  'public',
    group:       true,
    private:     true,

    run: async (sock, message, args, ctx) => {
        const { contextInfo } = ctx;
        const jid = message.key.remoteJid;
        if (!args.length) {
            return sock.sendMessage(jid, { text: `❌ *Usage:* \`.country <name>\``, contextInfo }, { quoted: message });
        }
        const name = args.join(' ');
        try {
            const res = await axios.get(`https://restcountries.com/v3.1/name/${encodeURIComponent(name)}`, { timeout: 10000 });
            const c = res.data[0];
            const currencies = Object.values(c.currencies || {}).map(cu => `${cu.name} (${cu.symbol || '—'})`).join(', ');
            const languages  = Object.values(c.languages || {}).join(', ');
            const flag       = c.flag || c.flags?.emoji || '';
            await sock.sendMessage(jid, {
                text:
                    `${flag} *${c.name.common}* _(${c.name.official})_\n\n` +
                    `🌍 *Region:* ${c.subregion || c.region}\n` +
                    `🏙️ *Capital:* ${c.capital?.[0] || 'N/A'}\n` +
                    `👥 *Population:* ${(c.population || 0).toLocaleString()}\n` +
                    `📐 *Area:* ${(c.area || 0).toLocaleString()} km²\n` +
                    `💰 *Currency:* ${currencies || 'N/A'}\n` +
                    `🗣️ *Languages:* ${languages || 'N/A'}\n` +
                    `📞 *Dial Code:* ${c.idd?.root || 'N/A'}${(c.idd?.suffixes || []).join('')}\n` +
                    `🌐 *TLD:* ${c.tld?.join(', ') || 'N/A'}\n` +
                    `🗺️ *Timezone:* ${c.timezones?.[0] || 'N/A'}`,
                contextInfo
            }, { quoted: message });
        } catch {
            await sock.sendMessage(jid, { text: `❌ Country *"${name}"* not found.`, contextInfo }, { quoted: message });
        }
    }
};

'use strict';
const axios = require('axios');

module.exports = {
    commands:    ['country', 'countryinfo'],
    description: 'Get detailed information about any country',
    usage:       '.country <name>  e.g. .country Kenya',
    permission:  'public',
    group:       true,
    private:     true,

    run: async (sock, message, args, ctx) => {
        const { contextInfo } = ctx;
        const jid = message.key.remoteJid;
        if (!args.length) {
            return sock.sendMessage(jid, {
                text: `❌ *Usage:* \`.country <name>\`\n_Example:_ \`.country Kenya\``,
                contextInfo
            }, { quoted: message });
        }
        const name = args.join(' ');
        try {
            const res = await axios.get(`https://restcountries.com/v3.1/name/${encodeURIComponent(name)}`, {
                params: { fullText: false },
                timeout: 10000
            });
            const c = res.data[0];
            const currencies = Object.values(c.currencies || {}).map(cu => `${cu.name} (${cu.symbol || '—'})`).join(', ');
            const languages  = Object.values(c.languages || {}).join(', ');
            const capital    = c.capital?.[0] || 'N/A';
            const region     = `${c.subregion || c.region || 'N/A'}`;
            const pop        = (c.population || 0).toLocaleString();
            const area       = (c.area || 0).toLocaleString();
            const tld        = c.tld?.join(', ') || 'N/A';
            const callingCode = c.idd?.root ? `${c.idd.root}${(c.idd.suffixes || []).join('')}` : 'N/A';
            const flag       = c.flag || c.flags?.emoji || '';

            await sock.sendMessage(jid, {
                text:
                    `${flag} *${c.name.common}* _(${c.name.official})_\n\n` +
                    `🌍 *Region:* ${region}\n` +
                    `🏙️ *Capital:* ${capital}\n` +
                    `👥 *Population:* ${pop}\n` +
                    `📐 *Area:* ${area} km²\n` +
                    `💰 *Currency:* ${currencies || 'N/A'}\n` +
                    `🗣️ *Languages:* ${languages || 'N/A'}\n` +
                    `📞 *Dial Code:* ${callingCode}\n` +
                    `🌐 *TLD:* ${tld}\n` +
                    `🗺️ *Timezone:* ${c.timezones?.[0] || 'N/A'}\n\n` +
                    `> _Powered by RestCountries API_`,
                contextInfo
            }, { quoted: message });
        } catch {
            await sock.sendMessage(jid, {
                text: `❌ Country *"${name}"* not found. Check the spelling and try again.`,
                contextInfo
            }, { quoted: message });
        }
    }
};

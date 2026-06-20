'use strict';
const axios = require('axios');

// restcountries.com v3.1 AND v2 are both deprecated as of 2026.
// Using countriesnow.space (confirmed working 2026-06) + worldbank as fallback.

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
            return sock.sendMessage(jid, { text: `❌ *Usage:* \`.country <name>\`\n\nExample: \`.country Kenya\``, contextInfo }, { quoted: message });
        }
        const name = args.join(' ');

        try {
            const [cnRes, wbRes] = await Promise.allSettled([
                axios.get(
                    `https://countriesnow.space/api/v0.1/countries/info?returns=currency,flag,unicodeFlag,dialCode&country=${encodeURIComponent(name.toLowerCase())}`,
                    { timeout: 8000 }
                ),
                axios.get(
                    `https://api.worldbank.org/v2/country?name=${encodeURIComponent(name)}&format=json&per_page=5`,
                    { timeout: 8000 }
                ),
            ]);

            const cn = cnRes.status === 'fulfilled' ? cnRes.value.data?.data : null;
            const wb = wbRes.status === 'fulfilled' ? wbRes.value.data?.[1]?.[0] : null;

            if (!cn && !wb) throw new Error('not found');

            const flag     = cn?.unicodeFlag || '';
            const currency = cn?.currency ? `${cn.currency.name} (${cn.currency.symbol || cn.currency.code})` : 'N/A';
            const dialCode = cn?.dialCode || 'N/A';
            const capital  = wb?.capitalCity || 'N/A';
            const region   = wb?.region?.value || 'N/A';
            const income   = wb?.incomeLevel?.value || '';
            const countryName = cn?.name || wb?.name || name;

            await sock.sendMessage(jid, {
                text:
                    `${flag} *${countryName}*\n\n` +
                    `🌍 *Region:* ${region}\n` +
                    `🏙️ *Capital:* ${capital}\n` +
                    `💰 *Currency:* ${currency}\n` +
                    `📞 *Dial Code:* ${dialCode}\n` +
                    (income ? `💼 *Income Level:* ${income}\n` : '') +
                    `\n🔗 https://en.wikipedia.org/wiki/${encodeURIComponent(countryName)}`,
                contextInfo
            }, { quoted: message });
        } catch {
            await sock.sendMessage(jid, {
                text: `❌ Country *"${name}"* not found.\n\n_Try a full name like "Kenya", "United States", "Germany"_`,
                contextInfo
            }, { quoted: message });
        }
    }
};

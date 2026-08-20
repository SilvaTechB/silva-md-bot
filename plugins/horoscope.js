'use strict';
const axios = require('axios');

const SIGNS = ['aries','taurus','gemini','cancer','leo','virgo','libra','scorpio','sagittarius','capricorn','aquarius','pisces'];
const EMOJIS = { aries:'♈',taurus:'♉',gemini:'♊',cancer:'♋',leo:'♌',virgo:'♍',libra:'♎',scorpio:'♏',sagittarius:'♐',capricorn:'♑',aquarius:'♒',pisces:'♓' };

module.exports = {
    commands:    ['horoscope', 'zodiac', 'horo'],
    description: 'Get daily horoscope for a zodiac sign',
    permission:  'public',
    group:       true,
    private:     true,
    run: async (sock, message, args, { sender, groupId, contextInfo }) => {
        const chatId = groupId || sender;
        const sign   = (args[0] || '').toLowerCase();
        if (!sign || !SIGNS.includes(sign)) {
            return sock.sendMessage(chatId, {
                text: `🔮 *Usage:* .horoscope <sign>\n\n*Signs:* ${SIGNS.join(', ')}\n\nExample: .horoscope leo`,
                contextInfo
            }, { quoted: message });
        }
        try {
            const { data } = await axios.get(
                `https://horoscope-app-api.vercel.app/api/v1/get-horoscope/daily?sign=${sign}&day=TODAY`,
                { timeout: 10000 }
            );
            const h    = data?.data;
            const date = h?.date || new Date().toDateString();
            const text = h?.horoscope_data || 'No horoscope available today.';
            await sock.sendMessage(chatId, {
                text: `${EMOJIS[sign]} *${sign.charAt(0).toUpperCase() + sign.slice(1)} Daily Horoscope*\n📅 ${date}\n\n${text}\n\n_Powered by Silva MD_`,
                contextInfo
            }, { quoted: message });
        } catch (e) {
            await sock.sendMessage(chatId, { text: `❌ Horoscope failed: ${e.message}`, contextInfo }, { quoted: message });
        }
    }
};

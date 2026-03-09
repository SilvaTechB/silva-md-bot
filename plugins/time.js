'use strict';
const axios = require('axios');

const ZONES = {
    nairobi:      'Africa/Nairobi',
    kenya:        'Africa/Nairobi',
    lagos:        'Africa/Lagos',
    cairo:        'Africa/Cairo',
    london:       'Europe/London',
    paris:        'Europe/Paris',
    berlin:       'Europe/Berlin',
    dubai:        'Asia/Dubai',
    india:        'Asia/Kolkata',
    delhi:        'Asia/Kolkata',
    tokyo:        'Asia/Tokyo',
    japan:        'Asia/Tokyo',
    beijing:      'Asia/Shanghai',
    china:        'Asia/Shanghai',
    newyork:      'America/New_York',
    'new york':   'America/New_York',
    losangeles:   'America/Los_Angeles',
    sydney:       'Australia/Sydney',
    australia:    'Australia/Sydney',
    brazil:       'America/Sao_Paulo',
    moscow:       'Europe/Moscow',
};

module.exports = {
    commands:    ['time', 'clock', 'timezone'],
    description: 'Get the current time in any city or timezone',
    usage:       '.time <city or timezone>  e.g. .time Nairobi  •  .time Tokyo',
    permission:  'public',
    group:       true,
    private:     true,

    run: async (sock, message, args, ctx) => {
        const { contextInfo } = ctx;
        const jid = message.key.remoteJid;

        if (!args.length) {
            const now = new Date().toLocaleString('en-US', {
                timeZone: 'Africa/Nairobi',
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
                hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
            });
            return sock.sendMessage(jid, {
                text:
                    `🕐 *Current Time (Nairobi)*\n\n${now}\n\n` +
                    `_Try:_ \`.time Tokyo\` · \`.time London\` · \`.time New York\``,
                contextInfo
            }, { quoted: message });
        }

        const input = args.join(' ').toLowerCase().replace(/\s+/g, '');
        const tz    = ZONES[args.join(' ').toLowerCase()] || ZONES[input] || args.join('/');

        try {
            const now = new Date().toLocaleString('en-US', {
                timeZone: tz,
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
                hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
            });
            await sock.sendMessage(jid, {
                text: `🕐 *Time in ${args.join(' ')}*\n\n${now}\n🌍 Timezone: \`${tz}\``,
                contextInfo
            }, { quoted: message });
        } catch {
            await sock.sendMessage(jid, {
                text:
                    `❌ Unknown timezone: *"${args.join(' ')}"*\n\n` +
                    `Try: Nairobi, Lagos, London, Paris, Dubai, Tokyo, Sydney, New York, Moscow`,
                contextInfo
            }, { quoted: message });
        }
    }
};

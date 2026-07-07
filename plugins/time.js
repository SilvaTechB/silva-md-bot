'use strict';

const ZONES = {
    nairobi:'Africa/Nairobi',kenya:'Africa/Nairobi',lagos:'Africa/Lagos',
    cairo:'Africa/Cairo',london:'Europe/London',paris:'Europe/Paris',
    berlin:'Europe/Berlin',dubai:'Asia/Dubai',india:'Asia/Kolkata',
    delhi:'Asia/Kolkata',tokyo:'Asia/Tokyo',japan:'Asia/Tokyo',
    beijing:'Asia/Shanghai',china:'Asia/Shanghai','new york':'America/New_York',
    newyork:'America/New_York',losangeles:'America/Los_Angeles',
    sydney:'Australia/Sydney',australia:'Australia/Sydney',
    brazil:'America/Sao_Paulo',moscow:'Europe/Moscow',
};

module.exports = {
    commands:    ['time', 'clock', 'timezone'],
    description: 'Get the current time in any city or timezone',
    usage:       '.time <city>',
    permission:  'public',
    group:       true,
    private:     true,

    run: async (sock, message, args, ctx) => {
        const { contextInfo } = ctx;
        const jid   = message.key.remoteJid;
        const input = args.join(' ').toLowerCase();
        const tz    = ZONES[input] || ZONES[input.replace(/\s+/g,'')] || (args.join('/') || 'Africa/Nairobi');
        const place = args.join(' ') || 'Nairobi';
        try {
            const now = new Date().toLocaleString('en-US', {
                timeZone: tz,
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
                hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
            });
            await sock.sendMessage(jid, {
                text: `🕐 *Time in ${place}*\n\n${now}\n🌍 Timezone: \`${tz}\``,
                contextInfo
            }, { quoted: message });
        } catch {
            await sock.sendMessage(jid, {
                text: `❌ Unknown timezone: *"${place}"*\n\nTry: Nairobi, London, Tokyo, New York, Dubai, Sydney`,
                contextInfo
            }, { quoted: message });
        }
    }
};

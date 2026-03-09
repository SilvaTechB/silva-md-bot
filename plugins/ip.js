'use strict';
const axios = require('axios');

module.exports = {
    commands:    ['ip', 'iplookup', 'ipinfo'],
    description: 'Look up information about any IP address',
    usage:       '.ip <address>  e.g. .ip 8.8.8.8',
    permission:  'public',
    group:       true,
    private:     true,

    run: async (sock, message, args, ctx) => {
        const { contextInfo } = ctx;
        const jid = message.key.remoteJid;
        if (!args.length) {
            return sock.sendMessage(jid, {
                text: `❌ *Usage:* \`.ip <address>\`\n_Example:_ \`.ip 8.8.8.8\``,
                contextInfo
            }, { quoted: message });
        }
        const ip = args[0].trim();
        try {
            const res = await axios.get(`http://ip-api.com/json/${encodeURIComponent(ip)}`, {
                params: { fields: 'status,message,country,regionName,city,zip,lat,lon,timezone,isp,org,as,query,mobile,proxy,hosting' },
                timeout: 8000
            });
            const d = res.data;
            if (d.status !== 'success') throw new Error(d.message || 'Lookup failed');
            await sock.sendMessage(jid, {
                text:
                    `🌐 *IP Lookup: ${d.query}*\n\n` +
                    `🏳️ *Country:* ${d.country}\n` +
                    `🏙️ *City:* ${d.city}, ${d.regionName}\n` +
                    `📮 *ZIP:* ${d.zip || 'N/A'}\n` +
                    `🕐 *Timezone:* ${d.timezone}\n` +
                    `📍 *Coordinates:* ${d.lat}, ${d.lon}\n` +
                    `🏢 *ISP:* ${d.isp}\n` +
                    `🏛️ *Org:* ${d.org || 'N/A'}\n` +
                    `📡 *AS:* ${d.as || 'N/A'}\n` +
                    `📱 *Mobile:* ${d.mobile ? 'Yes' : 'No'}\n` +
                    `🕵️ *Proxy/VPN:* ${d.proxy ? '⚠️ Yes' : 'No'}\n` +
                    `🖥️ *Hosting:* ${d.hosting ? 'Yes' : 'No'}\n\n` +
                    `> _Powered by ip-api.com_`,
                contextInfo
            }, { quoted: message });
        } catch (err) {
            await sock.sendMessage(jid, {
                text: `❌ IP lookup failed: ${err.message}`,
                contextInfo
            }, { quoted: message });
        }
    }
};

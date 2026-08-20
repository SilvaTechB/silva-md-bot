'use strict';
const axios = require('axios');

module.exports = {
    commands:    ['whois', 'domain', 'domaininfo'],
    description: 'WHOIS lookup for a domain',
    permission:  'public',
    group:       true,
    private:     true,
    run: async (sock, message, args, { sender, contextInfo }) => {
        const domain = (args[0] || '').replace(/https?:\/\//g, '').replace(/\//g, '').trim();
        if (!domain || !domain.includes('.')) {
            return sock.sendMessage(sender, {
                text: '🌐 Please provide a domain name.\nExample: .whois google.com',
                contextInfo
            }, { quoted: message });
        }
        await sock.sendMessage(sender, { text: '⏳ Looking up domain...', contextInfo }, { quoted: message });
        try {
            const { data } = await axios.get(`https://rdap.org/domain/${domain}`, { timeout: 15000 });
            const name     = data.ldhName || domain;
            const status   = (data.status || []).join(', ') || 'N/A';
            const events   = {};
            (data.events || []).forEach(e => { events[e.eventAction] = e.eventDate?.slice(0, 10); });
            const ns       = (data.nameservers || []).map(n => n.ldhName).join(', ') || 'N/A';
            await sock.sendMessage(sender, {
                text:
`🌐 *WHOIS: ${name}*

📋 *Status:*      ${status}
📅 *Registered:*  ${events.registration || 'N/A'}
🔄 *Updated:*     ${events['last changed'] || events.last_update || 'N/A'}
⏰ *Expires:*     ${events.expiration || 'N/A'}
🖥️ *Nameservers:* ${ns}

_Powered by Silva MD_`,
                contextInfo
            }, { quoted: message });
        } catch (e) {
            await sock.sendMessage(sender, { text: `❌ WHOIS lookup failed: ${e.message}`, contextInfo }, { quoted: message });
        }
    }
};

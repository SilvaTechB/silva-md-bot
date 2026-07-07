'use strict';
const dns = require('dns').promises;

module.exports = {
    commands:    ['dns', 'dnslookup', 'nslookup'],
    description: 'DNS lookup for a domain',
    permission:  'public',
    group:       true,
    private:     true,
    run: async (sock, message, args, { sender, contextInfo }) => {
        const domain = (args[0] || '').replace(/https?:\/\//g, '').replace(/\//g, '').trim();
        if (!domain || !domain.includes('.')) {
            return sock.sendMessage(sender, {
                text: '🔍 Please provide a domain.\nExample: .dns google.com',
                contextInfo
            }, { quoted: message });
        }
        try {
            const [addresses, mx, ns, txt] = await Promise.allSettled([
                dns.resolve4(domain),
                dns.resolveMx(domain),
                dns.resolveNs(domain),
                dns.resolveTxt(domain)
            ]);
            const a   = addresses.status === 'fulfilled' ? addresses.value.join(', ') : 'N/A';
            const mxR = mx.status === 'fulfilled' ? mx.value.slice(0, 3).map(r => r.exchange).join(', ') : 'N/A';
            const nsR = ns.status === 'fulfilled' ? ns.value.slice(0, 3).join(', ') : 'N/A';
            const txtR = txt.status === 'fulfilled' ? txt.value.slice(0, 2).map(t => t.join('')).join('\n') : 'N/A';
            await sock.sendMessage(sender, {
                text:
`🔍 *DNS Lookup: ${domain}*

🖥️ *A (IPv4):*  ${a}
📧 *MX:*        ${mxR}
🌐 *NS:*        ${nsR}
📋 *TXT:*       ${txtR}

_Powered by Silva MD_`,
                contextInfo
            }, { quoted: message });
        } catch (e) {
            await sock.sendMessage(sender, { text: `❌ DNS lookup failed: ${e.message}`, contextInfo }, { quoted: message });
        }
    }
};

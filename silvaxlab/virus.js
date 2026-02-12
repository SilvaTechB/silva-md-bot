const axios = require('axios');

const handler = {
    help: ['scanurl', 'urlscan', 'checksafe'],
    tags: ['security', 'tools'],
    command: /^(scanurl|urlscan|checksafe)$/i,
    group: false,
    admin: false,
    botAdmin: false,
    owner: false,

    execute: async ({ jid, sock, message, args }) => {
        const sender = message.key.participant || message.key.remoteJid;

        try {
            if (!args[0]) {
                return sock.sendMessage(
                    jid,
                    {
                        text:
                            '❌ *Please provide a URL to scan*\n\n' +
                            'Example:\n.scanurl https://example.com',
                        contextInfo: ctx(sender, 'Silva MD Security ⚠️')
                    },
                    { quoted: message }
                );
            }

            // Normalize URL
            let url = args[0];
            if (!/^https?:\/\//i.test(url)) {
                url = 'https://' + url;
            }

            try {
                new URL(url);
            } catch {
                return sock.sendMessage(
                    jid,
                    {
                        text: '⚠️ *Invalid URL format*',
                        contextInfo: ctx(sender, 'Silva MD Errors ⚠️')
                    },
                    { quoted: message }
                );
            }

            await sock.sendMessage(
                jid,
                {
                    text: '🔍 *Scanning URL with VirusTotal…*\n⏳ Please wait',
                    contextInfo: ctx(sender, 'Silva MD Security 🛡️')
                },
                { quoted: message }
            );

            // 🔑 Hard-coded VirusTotal API key (as requested)
            const apiKey =
                '23e62ab81fe1c82d865f39fc674dead42b1ae2b3079fffebf96be5b19aebcf47';

            // Submit URL for analysis
            const submit = await axios.post(
                'https://www.virustotal.com/api/v3/urls',
                new URLSearchParams({ url }),
                {
                    headers: {
                        'x-apikey': apiKey,
                        'Content-Type': 'application/x-www-form-urlencoded'
                    },
                    timeout: 20000
                }
            );

            const analysisId = submit.data.data.id;

            // Wait a bit before fetching results
            await new Promise(r => setTimeout(r, 5000));

            const analysis = await axios.get(
                `https://www.virustotal.com/api/v3/analyses/${analysisId}`,
                {
                    headers: { 'x-apikey': apiKey },
                    timeout: 20000
                }
            );

            const attrs = analysis.data.data.attributes;
            const stats = attrs.stats;
            const scanDate = new Date(attrs.date * 1000).toLocaleString();

            let status = '✅ SAFE';
            if (stats.malicious > 0) {
                status = `❌ MALICIOUS (${stats.malicious})`;
            } else if (stats.suspicious > 0) {
                status = `⚠️ SUSPICIOUS (${stats.suspicious})`;
            }

            const report =
                `🛡️ *URL Safety Report*\n\n` +
                `🔗 *URL:* ${url}\n` +
                `📅 *Scanned:* ${scanDate}\n` +
                `🧪 *Status:* ${status}\n\n` +
                `📊 *Detections*\n` +
                `✔️ Harmless: ${stats.harmless}\n` +
                `⚠️ Suspicious: ${stats.suspicious}\n` +
                `❌ Malicious: ${stats.malicious}\n` +
                `❓ Undetected: ${stats.undetected}\n\n` +
                `_Powered by VirusTotal_`;

            await sock.sendMessage(
                jid,
                {
                    text: report,
                    contextInfo: ctx(sender, 'Silva MD Security 🛡️')
                },
                { quoted: message }
            );

        } catch (err) {
            console.error('❌ URL Scan Error:', err);

            let msg = '⚠️ *URL scan failed*\n';
            if (err.code === 'ECONNABORTED') {
                msg += 'Scan timed out. Try again later.';
            } else {
                msg += err.message;
            }

            await sock.sendMessage(
                jid,
                {
                    text: msg,
                    contextInfo: ctx(sender, 'Silva MD Errors ⚠️')
                },
                { quoted: message }
            );
        }
    }
};

module.exports = { handler };


// 🧠 Shared contextInfo builder (Silva MD standard)
function ctx(sender, name) {
    return {
        mentionedJid: [sender],
        forwardingScore: 999,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
            newsletterJid: '120363200367779016@newsletter',
            newsletterName: name,
            serverMessageId: Math.floor(Math.random() * 1000)
        }
    };
}
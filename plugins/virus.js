const axios = require('axios');

module.exports = {
    name: 'linkscanner',
    commands: ['scanurl', 'urlscan', 'checksafe'],
    handler: async ({ sock, m, sender, args, contextInfo }) => {
        try {
            // Check if URL is provided
            if (!args[0]) {
                return sock.sendMessage(sender, {
                    text: '❌ Please provide a URL to scan.\nExample: .scanurl https://example.com',
                    contextInfo
                }, { quoted: m });
            }

            // Extract URL (supports with/without http://)
            let url = args[0];
            if (!url.match(/^https?:\/\//)) {
                url = 'https://' + url;
            }

            // Validate URL format
            try {
                new URL(url);
            } catch {
                return sock.sendMessage(sender, {
                    text: '⚠️ Invalid URL format. Please include http:// or https://',
                    contextInfo
                }, { quoted: m });
            }

            // Processing message
            await sock.sendMessage(sender, {
                text: '🔍 Scanning URL with VirusTotal... (This may take 10-20 seconds)',
                contextInfo
            }, { quoted: m });

            // VirusTotal API request
            const apiKey = '23e62ab81fe1c82d865f39fc674dead42b1ae2b3079fffebf96be5b19aebcf47'; // Replace with your actual API key
            const response = await axios.post(
                'https://www.virustotal.com/api/v3/urls',
                { url: url },
                {
                    headers: {
                        'x-apikey': apiKey,
                        'Content-Type': 'application/x-www-form-urlencoded'
                    },
                    timeout: 20000 // 20 second timeout
                }
            );

            // Get analysis ID from initial response
            const analysisId = response.data.data.id;

            // Wait a moment then get results
            await new Promise(resolve => setTimeout(resolve, 5000));
            
            const resultResponse = await axios.get(
                `https://www.virustotal.com/api/v3/analyses/${analysisId}`,
                {
                    headers: { 'x-apikey': apiKey },
                    timeout: 20000
                }
            );

            const stats = resultResponse.data.data.attributes.stats;
            const scanDate = new Date(resultResponse.data.data.attributes.date * 1000).toLocaleString();

            // Generate safety report
            let safetyStatus = '✅ SAFE';
            if (stats.malicious > 0) {
                safetyStatus = `❌ MALICIOUS (${stats.malicious} engines detected)`;
            } else if (stats.suspicious > 0) {
                safetyStatus = `⚠️ SUSPICIOUS (${stats.suspicious} engines flagged)`;
            }

            const reportMessage = `🛡️ *URL Safety Report*\n\n` +
                                `🔗 *URL:* ${url}\n` +
                                `📅 *Scanned:* ${scanDate}\n` +
                                `🛡️ *Status:* ${safetyStatus}\n\n` +
                                `*Scan Results:*\n` +
                                `✔️ Harmless: ${stats.harmless}\n` +
                                `⚠️ Suspicious: ${stats.suspicious}\n` +
                                `❌ Malicious: ${stats.malicious}\n` +
                                `❓ Undetected: ${stats.undetected}\n\n` +
                                `_Powered by VirusTotal_`;

            await sock.sendMessage(sender, {
                text: reportMessage,
                contextInfo
            }, { quoted: m });

        } catch (error) {
            console.error('❌ URL Scan Error:', error.message);
            
            let errorMsg = '⚠️ An error occurred while scanning the URL.\n';
            if (error.response?.status === 404) {
                errorMsg += 'URL not found in VirusTotal database.';
            } else if (error.message.includes('timeout')) {
                errorMsg += 'The scan took too long. Please try again later.';
            } else {
                errorMsg += 'Please ensure:\n1. The URL is valid\n2. Your API key is correct\n3. Try again later';
            }

            await sock.sendMessage(sender, {
                text: errorMsg,
                contextInfo
            }, { quoted: m });
        }
    }
};

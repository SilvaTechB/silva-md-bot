'use strict';

const axios = require('axios');

module.exports = {
    commands:    ['apk', 'apkdl', 'getapk'],
    description: 'Search and download an APK from Aptoide',
    permission:  'public',
    group:       true,
    private:     true,
    run: async (sock, message, args, { sender, contextInfo }) => {
        const query = args.join(' ');
        if (!query) {
            return sock.sendMessage(sender, {
                text: '❌ Please provide an app name.\n\nExample: .apk whatsapp',
                contextInfo
            }, { quoted: message });
        }

        await sock.sendMessage(sender, { text: `🔍 Searching for *${query}*...`, contextInfo }, { quoted: message });

        try {
            const { data } = await axios.get(
                `http://ws75.aptoide.com/api/7/apps/search/query=${encodeURIComponent(query)}/limit=1`,
                {
                    timeout: 15000,
                    headers: { 'User-Agent': 'Mozilla/5.0' }
                }
            );

            const list = data?.datalist?.list;
            if (!list?.length) {
                return sock.sendMessage(sender, {
                    text: `❌ No APK found for "*${query}*"`,
                    contextInfo
                }, { quoted: message });
            }

            const app    = list[0];
            const sizeMB = (app.size / 1048576).toFixed(2);

            await sock.sendMessage(sender, {
                document: { url: app.file.path_alt },
                fileName: `${app.name}.apk`,
                mimetype: 'application/vnd.android.package-archive',
                caption:
`📱 *APK Downloader*

🔍 *Name:* ${app.name}
📦 *Package:* ${app.package}
📊 *Size:* ${sizeMB} MB
🔄 *Updated:* ${app.updated}
👨‍💻 *Developer:* ${app.developer?.name || 'Unknown'}

_Powered by Silva MD_`,
                contextInfo
            }, { quoted: message });
        } catch (err) {
            console.error('[APK]', err.message);
            await sock.sendMessage(sender, {
                text: `⚠️ APK download failed: ${err.message}`,
                contextInfo
            }, { quoted: message });
        }
    }
};

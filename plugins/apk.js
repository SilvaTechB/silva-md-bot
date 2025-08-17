const axios = require('axios');

module.exports = {
    commands: ['apk', 'apkdl', 'getapk'],
    handler: async ({ sock, m, sender, args, contextInfo = {} }) => {
        try {
            // Check if search query is provided
            const query = args.join(' ');
            if (!query) {
                return await sock.sendMessage(sender, {
                    text: '❌ Please provide an app name to search!\n\nExample: .apk whatsapp',
                    contextInfo
                }, { quoted: m });
            }

            // Processing message
            await sock.sendMessage(sender, {
                text: '🔍 Searching for APK...',
                contextInfo
            }, { quoted: m });

            // Fetch APK data from Aptoide API
            const apiUrl = `http://ws75.aptoide.com/api/7/apps/search/query=${encodeURIComponent(query)}/limit=1`;
            const response = await axios.get(apiUrl, {
                timeout: 15000, // 15-second timeout
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.102 Safari/537.36'
                }
            });

            const data = response.data;
            
            // Check if results exist
            if (!data.datalist?.list?.length) {
                return await sock.sendMessage(sender, {
                    text: `❌ No APK found for "${query}"`,
                    contextInfo
                }, { quoted: m });
            }

            const app = data.datalist.list[0];
            const sizeInMB = (app.size / (1024 * 1024)).toFixed(2);

            // Create caption
            const caption = `
📱 *APK Downloader*

🔍 *Name:* ${app.name}
📦 *Package:* ${app.package}
📊 *Size:* ${sizeInMB} MB
🔄 *Updated:* ${app.updated}
👨‍💻 *Developer:* ${app.developer?.name || "Unknown"}

_Downloading..._`.trim();

            // Send the APK file
            await sock.sendMessage(sender, {
                document: { url: app.file.path_alt },
                fileName: `${app.name}.apk`,
                mimetype: "application/vnd.android.package-archive",
                caption: caption,
                contextInfo
            }, { quoted: m });

        } catch (error) {
            console.error('❌ APK Download Error:', error.message);
            console.error('Error details:', error.response?.data || error.stack);
            
            await sock.sendMessage(sender, {
                text: `⚠️ APK download failed!\nReason: ${error.message || 'Service unavailable'}`,
                contextInfo
            }, { quoted: m });
        }
    }
};

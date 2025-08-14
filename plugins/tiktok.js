const axios = require('axios');

module.exports = {
    commands: ['tiktok', 'ttdl', 'tiktokdl'],
    handler: async ({ sock, m, sender, args, contextInfo = {} }) => {
        try {
            // Extract URL from message
            const url = args[0]?.match(/(https?:\/\/[^\s]+)/)?.[0];
            
            // Validate URL
            if (!url || !/tiktok\.com|vt\.tiktok\.com/.test(url)) {
                return await sock.sendMessage(sender, {
                    text: '❌ Invalid TikTok URL!\nPlease provide a valid TikTok link.\n\nExample: !tiktok https://vt.tiktok.com/ZSje1Vkup/',
                    contextInfo
                }, { quoted: m });
            }

            // Processing message
            await sock.sendMessage(sender, {
                text: '⏳ Processing TikTok video...',
                contextInfo
            }, { quoted: m });

            // Fetch video data from Silva API using axios
            const apiUrl = `https://silva-api.vercel.app/download/tiktokdl?url=${encodeURIComponent(url)}`;
            const response = await axios.get(apiUrl, {
                timeout: 15000, // 15-second timeout
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.102 Safari/537.36'
                }
            });
            
            const data = response.data;
            console.log('API Response:', JSON.stringify(data, null, 2)); // Log for debugging

            // Handle different API response formats
            let downloadUrl;
            if (data.status === "success") {
                // New API format
                const video = data.result;
                downloadUrl = video.nowm || video.wm || video.hd || video.sd;
            } else if (data.videoUrl) {
                // Alternative API format
                downloadUrl = data.videoUrl;
            } else if (data.url) {
                // Another possible format
                downloadUrl = data.url;
            }

            if (!downloadUrl) {
                throw new Error('No downloadable video found in API response');
            }

            // Send video with metadata
            await sock.sendMessage(sender, {
                video: { url: downloadUrl },
                caption: `⬇️ *TikTok Download*\n\n🔗 Source: ${url}\n✨ _Powered by Silva API_`,
                contextInfo
            }, { quoted: m });

        } catch (error) {
            console.error('❌ TikTok Download Error:', error.message);
            console.error('Error details:', error.response?.data || error.stack);
            
            await sock.sendMessage(sender, {
                text: `⚠️ Download failed!\nReason: ${error.message || 'API service unavailable'}\n\nTry again later or use a different URL.`,
                contextInfo
            }, { quoted: m });
        }
    }
};

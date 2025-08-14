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
            const apiUrl = `https://apis-keith.vercel.app/download/tiktokdl2?url=${encodeURIComponent(url)}`;
            const response = await axios.get(apiUrl);
            const data = response.data;

            // Handle API errors
            if (data.status !== "success") {
                throw new Error(data.message || 'API returned non-success status');
            }

            // Get best available video URL
            const video = data.result;
            const downloadUrl = video.nowm || video.wm || video.hd || video.sd;
            
            if (!downloadUrl) {
                throw new Error('No downloadable video found in API response');
            }

            // Send video with metadata
            await sock.sendMessage(sender, {
                video: { url: downloadUrl },
                caption: `⬇️ *TikTok Download*\n\n🔗 Source: ${url}\n🎬 Quality: ${video.nowm ? 'No Watermark' : video.wm ? 'With Watermark' : 'Standard'}\n\n✨ _Powered by Silva API_`,
                contextInfo
            }, { quoted: m });

        } catch (error) {
            console.error('❌ TikTok Download Error:', error.message);
            await sock.sendMessage(sender, {
                text: `⚠️ Download failed!\nReason: ${error.message || 'Unknown error'}\n\nPlease try again later with a different URL.`,
                contextInfo
            }, { quoted: m });
        }
    }
};

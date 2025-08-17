const axios = require('axios');

module.exports = {
    commands: ['tiktok', 'tt', 'ttdl', 'tiktokdl'],
    handler: async ({ sock, m, sender, args, contextInfo = {} }) => {
        try {
            // Extract URL from message
            const url = args[0]?.match(/(https?:\/\/[^\s]+)/)?.[0];
            
            // Validate URL
            if (!url || !/tiktok\.com|vt\.tiktok\.com/.test(url)) {
                return await sock.sendMessage(sender, {
                    text: '❌ Invalid TikTok URL!\nPlease provide a valid TikTok link.\n\nExample: .tiktok https://vt.tiktok.com/ZSje1Vkup/',
                    contextInfo
                }, { quoted: m });
            }

            // Processing message
            await sock.sendMessage(sender, {
                text: '⏳ Processing TikTok content...',
                contextInfo
            }, { quoted: m });

            // API endpoints to try (fallback system)
            const apiVersions = [
                'https://api.tiklydown.eu.org/api/download/v5',
                'https://api.tiklydown.eu.org/api/download/v4',
                'https://api.tiklydown.eu.org/api/download/v3',
                'https://api.tiklydown.eu.org/api/download/v2',
                'https://api.tiklydown.eu.org/api/download'
            ];

            const apiKey = 'tk_134e318954fbc49653bed696ff22e0e441145ea17e22196a628fa54fb5dd449b';
            let response;
            let lastError;

            // Try each API endpoint until one works
            for (const endpoint of apiVersions) {
                try {
                    const apiUrl = `${endpoint}?url=${encodeURIComponent(url)}&apikey=${apiKey}`;
                    response = await axios.get(apiUrl, {
                        timeout: 15000,
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.102 Safari/537.36'
                        }
                    });
                    
                    // If we got a successful response, break the loop
                    if (response.data && (response.data.videoUrl || response.data.images)) {
                        break;
                    }
                } catch (err) {
                    lastError = err;
                    continue; // Try next endpoint
                }
            }

            // Check if we got a valid response
            if (!response || !response.data) {
                throw lastError || new Error('All API endpoints failed');
            }

            const data = response.data;
            
            // Handle video response
            if (data.videoUrl) {
                await sock.sendMessage(sender, {
                    video: { url: data.videoUrl },
                    caption: `🎵 *TikTok Video*\n\n` +
                             `👤 *Author:* ${data.author?.nickname || 'Unknown'}\n` +
                             `❤️ *Likes:* ${data.stats?.diggCount || 'N/A'}\n` +
                             `💬 *Comments:* ${data.stats?.commentCount || 'N/A'}\n` +
                             `🔗 *Original URL:* ${url}\n\n` +
                             `_Powered by Tiklydown API_`,
                    contextInfo
                }, { quoted: m });
            }
            // Handle photo response (slideshow)
            else if (data.images && data.images.length > 0) {
                // For single image
                if (data.images.length === 1) {
                    await sock.sendMessage(sender, {
                        image: { url: data.images[0] },
                        caption: `📸 *TikTok Photo*\n\n` +
                                 `👤 *Author:* ${data.author?.nickname || 'Unknown'}\n` +
                                 `❤️ *Likes:* ${data.stats?.diggCount || 'N/A'}\n` +
                                 `🔗 *Original URL:* ${url}\n\n` +
                                 `_Powered by Tiklydown API_`,
                        contextInfo
                    }, { quoted: m });
                }
                // For multiple images (slideshow)
                else {
                    const imageMessages = data.images.map((imgUrl, index) => ({
                        image: { url: imgUrl },
                        caption: index === 0 ? 
                            `🖼️ *TikTok Slideshow (${data.images.length} photos)*\n\n` +
                            `👤 *Author:* ${data.author?.nickname || 'Unknown'}\n` +
                            `❤️ *Likes:* ${data.stats?.diggCount || 'N/A'}\n` +
                            `🔗 *Original URL:* ${url}\n\n` +
                            `_Powered by Tiklydown API_` : '',
                        contextInfo: index === 0 ? contextInfo : undefined
                    }));

                    // Send images sequentially
                    for (const msg of imageMessages) {
                        await sock.sendMessage(sender, msg, { quoted: m });
                    }
                }
            }
            else {
                throw new Error('No media found in response');
            }

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

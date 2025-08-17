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

            // Multiple API endpoints as fallbacks
            const apiEndpoints = [
                {
                    url: `https://api.tiklydown.eu.org/api/download?url=${encodeURIComponent(url)}`,
                    handler: (data) => data.videoUrl ? { videoUrl: data.videoUrl, ...data } : null
                },
                {
                    url: `https://api16-normal-c-useast1a.tiktokv.com/aweme/v1/feed/?aweme_id=${url.split('/').pop().split('?')[0]}`,
                    handler: (data) => {
                        if (data.aweme_list?.[0]?.video?.play_addr?.url_list?.[0]) {
                            const item = data.aweme_list[0];
                            return {
                                videoUrl: item.video.play_addr.url_list[0],
                                author: item.author,
                                stats: item.statistics
                            };
                        }
                        return null;
                    }
                },
                {
                    url: `https://tikwm.com/api/?url=${encodeURIComponent(url)}`,
                    handler: (data) => data.data?.wmplay ? { 
                        videoUrl: data.data.wmplay, 
                        author: data.data.author,
                        stats: data.data
                    } : null
                },
                {
                    url: `https://www.tikwm.com/api/?url=${encodeURIComponent(url)}`,
                    handler: (data) => data.data?.wmplay ? { 
                        videoUrl: data.data.wmplay, 
                        author: data.data.author,
                        stats: data.data
                    } : null
                }
            ];

            let result = null;
            let lastError = null;

            // Try each API endpoint until one works
            for (const endpoint of apiEndpoints) {
                try {
                    const response = await axios.get(endpoint.url, {
                        timeout: 20000,
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.102 Safari/537.36',
                            'Accept': 'application/json'
                        }
                    });

                    result = endpoint.handler(response.data);
                    if (result) break;
                } catch (err) {
                    lastError = err;
                    continue;
                }
            }

            if (!result) {
                throw lastError || new Error('All API endpoints failed to return media');
            }

            // Send the media
            if (result.videoUrl) {
                await sock.sendMessage(sender, {
                    video: { url: result.videoUrl },
                    caption: `🎵 *TikTok Video*\n\n` +
                             `👤 *Author:* ${result.author?.nickname || 'Unknown'}\n` +
                             `❤️ *Likes:* ${result.stats?.digg_count || result.stats?.likeCount || 'N/A'}\n` +
                             `💬 *Comments:* ${result.stats?.comment_count || 'N/A'}\n` +
                             `🔗 *Original URL:* ${url}\n\n` +
                             `_Powered by Silva MD Bot_`,
                    contextInfo
                }, { quoted: m });
            } else {
                throw new Error('No downloadable media found');
            }

        } catch (error) {
            console.error('❌ TikTok Download Error:', error.message);
            console.error('Error details:', error.response?.data || error.stack);
            
            await sock.sendMessage(sender, {
                text: `⚠️ Download failed!\nReason: ${error.message || 'API service unavailable'}\n\nPossible solutions:\n1. Try again later\n2. Use a different URL\n3. The video may be private or restricted\n4. Server may be temporarily down`,
                contextInfo
            }, { quoted: m });
        }
    }
};

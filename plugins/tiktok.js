const axios = require('axios');
const { pipeline } = require('stream');
const { promisify } = require('util');
const streamPipeline = promisify(pipeline);
const fs = require('fs');
const os = require('os');
const path = require('path');

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
                text: '⏳ Processing TikTok content... (This may take 10-20 seconds)',
                contextInfo
            }, { quoted: m });

            // Multiple API endpoints with proper error handling
            const apiEndpoints = [
                {
                    name: 'Tiklydown V1',
                    url: `https://api.tiklydown.eu.org/api/download?url=${encodeURIComponent(url)}`,
                    handler: (data) => {
                        if (!data) return null;
                        return data.videoUrl ? {
                            videoUrl: data.videoUrl.replace(/watermark=1/, 'watermark=0'),
                            author: data.author,
                            stats: data.stats
                        } : null;
                    }
                },
                {
                    name: 'TikWM API',
                    url: `https://tikwm.com/api/?url=${encodeURIComponent(url)}`,
                    handler: (data) => {
                        if (!data?.data) return null;
                        return {
                            videoUrl: data.data.play,
                            author: data.data.author,
                            stats: {
                                digg_count: data.data.digg_count,
                                comment_count: data.data.comment_count
                            }
                        };
                    }
                },
                {
                    name: 'Snaptik',
                    url: `https://snaptik.app/abc2.php?url=${encodeURIComponent(url)}`,
                    handler: (data) => {
                        if (!data?.video_url) return null;
                        return {
                            videoUrl: data.video_url,
                            author: { nickname: data.author_name },
                            stats: {
                                digg_count: data.likes_count,
                                comment_count: data.comments_count
                            }
                        };
                    }
                }
            ];

            let result = null;
            let tempFilePath = null;

            // Try each API endpoint with proper timeout and abort control
            for (const endpoint of apiEndpoints) {
                try {
                    const controller = new AbortController();
                    const timeout = setTimeout(() => controller.abort(), 25000); // 25s timeout

                    console.log(`Trying ${endpoint.name}...`);
                    const response = await axios.get(endpoint.url, {
                        signal: controller.signal,
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.102 Safari/537.36',
                            'Accept': 'application/json'
                        }
                    });
                    clearTimeout(timeout);

                    result = endpoint.handler(response.data);
                    if (result) {
                        console.log(`Success with ${endpoint.name}`);
                        break;
                    }
                } catch (err) {
                    console.error(`${endpoint.name} failed:`, err.message);
                    continue;
                }
            }

            if (!result) {
                throw new Error('All download methods failed. The video may be private or restricted.');
            }

            // Create temp file path
            tempFilePath = path.join(os.tmpdir(), `tiktok_${Date.now()}.mp4`);

            // Download the video with proper error handling
            try {
                const response = await axios({
                    method: 'get',
                    url: result.videoUrl,
                    responseType: 'stream',
                    timeout: 30000
                });

                const writer = fs.createWriteStream(tempFilePath);
                await streamPipeline(response.data, writer);

                // Verify file was downloaded
                const stats = fs.statSync(tempFilePath);
                if (stats.size < 1024) {
                    throw new Error('Downloaded file is too small (may be corrupted)');
                }

                // Send the video file
                await sock.sendMessage(sender, {
                    video: fs.readFileSync(tempFilePath),
                    caption: `🎵 *TikTok Video*\n\n` +
                             `👤 *Author:* ${result.author?.nickname || 'Unknown'}\n` +
                             `❤️ *Likes:* ${result.stats?.digg_count || result.stats?.likeCount || 'N/A'}\n` +
                             `💬 *Comments:* ${result.stats?.comment_count || 'N/A'}\n` +
                             `🔗 *Original URL:* ${url}\n\n` +
                             `_Downloaded via Silva MD Bot_`,
                    contextInfo
                }, { quoted: m });

            } finally {
                // Clean up temp file
                if (tempFilePath && fs.existsSync(tempFilePath)) {
                    fs.unlinkSync(tempFilePath);
                }
            }

        } catch (error) {
            console.error('❌ TikTok Download Error:', error.message);
            console.error('Error stack:', error.stack);
            
            let errorMessage = `⚠️ Download failed!\nReason: ${error.message}\n\n`;
            
            if (error.message.includes('aborted') || error.message.includes('timeout')) {
                errorMessage += `The download was interrupted. This could be because:\n` +
                               `1. The server took too long to respond\n` +
                               `2. Your internet connection is unstable\n` +
                               `3. The video is too large\n\n` +
                               `Try again with a shorter video or check your connection.`;
            } else {
                errorMessage += `Possible solutions:\n` +
                               `1. Try again later\n` +
                               `2. Use a different URL\n` +
                               `3. The video may be private/restricted\n` +
                               `4. Try a shorter video\n` +
                               `5. Server may be temporarily down`;
            }

            await sock.sendMessage(sender, {
                text: errorMessage,
                contextInfo
            }, { quoted: m });
        }
    }
};

// plugins/tiktok.js
const axios = require('axios');

module.exports = {
    name: 'tiktok',
    commands: ['tiktok', 'ttdl'],
    tags: ['downloader'],
    description: 'Download TikTok videos without watermark',
    handler: async ({ sock, m, sender, args, isGroup }) => {
        const url = args[0];
        
        if (!url || !url.includes('tiktok.com')) {
            return sock.sendMessage(
                sender,
                { 
                    text: '🚫 *Invalid TikTok URL*\n\nPlease provide a valid TikTok link\nExample: *.tiktok https://vm.tiktok.com/xyz*',
                    contextInfo: {
                        externalAdReply: {
                            title: "TikTok Downloader",
                            body: "Provide a valid link",
                            thumbnailUrl: "https://files.catbox.moe/5uli5p.jpeg",
                            mediaType: 1
                        }
                    }
                },
                { quoted: m }
            );
        }

        const processingMsg = await sock.sendMessage(
            sender,
            { 
                text: '⏳ *Processing TikTok video...*',
                contextInfo: {
                    externalAdReply: {
                        title: "Downloading",
                        body: "Please wait...",
                        thumbnailUrl: "https://files.catbox.moe/5uli5p.jpeg",
                        mediaType: 1
                    }
                }
            },
            { quoted: m }
        );

        try {
            const apiUrl = `https://api.tiklydown.eu.org/api/download?url=${encodeURIComponent(url)}`;
            const response = await axios.get(apiUrl);
            const data = response.data;

            if (!data?.video?.noWatermark) {
                throw new Error('No video found from API');
            }

            const videoUrl = data.video.noWatermark;
            const audioUrl = data.audio;
            const author = data.author?.name || 'Unknown';
            const username = data.author?.unique_id || 'N/A';

            const caption = `
🎵 *TIKTOK DOWNLOADER* 🎵

• *Creator:* ${author} (@${username})
• *Likes:* ${data.stats?.likeCount || 0}
• *Comments:* ${data.stats?.commentCount || 0}
• *Shares:* ${data.stats?.shareCount || 0}

🔗 *Options:*
1. Send Video
2. Audio Only

💡 Reply with your choice (1 or 2)
            `.trim();

            // Send initial video
            await sock.sendMessage(
                sender,
                {
                    video: { url: videoUrl },
                    caption: caption,
                    contextInfo: {
                        mentionedJid: [sender],
                        externalAdReply: {
                            title: "TikTok Video",
                            body: `By ${author}`,
                            thumbnailUrl: "https://files.catbox.moe/5uli5p.jpeg",
                            mediaType: 1
                        }
                    }
                },
                { quoted: m }
            );

            // Delete processing message
            await sock.sendMessage(
                sender,
                { delete: processingMsg.key }
            );

            // Handle user choice
            const choiceHandler = async (response) => {
                if (response.key.remoteJid !== sender) return;
                
                const choice = response.message?.conversation || 
                              response.message?.extendedTextMessage?.text;

                if (choice === '1') {
                    await sock.sendMessage(
                        sender,
                        {
                            video: { url: videoUrl },
                            caption: '🎬 *TikTok Video* (No Watermark)',
                            contextInfo: {
                                externalAdReply: {
                                    title: "Video Downloaded",
                                    body: "Silva MD TikTok Downloader",
                                    thumbnailUrl: "https://files.catbox.moe/5uli5p.jpeg",
                                    mediaType: 1
                                }
                            }
                        },
                        { quoted: response }
                    );
                } 
                else if (choice === '2') {
                    await sock.sendMessage(
                        sender,
                        {
                            audio: { url: audioUrl },
                            mimetype: 'audio/mp4',
                            fileName: `${author}_tiktok_audio.mp3`,
                            caption: '🎵 *TikTok Audio*',
                            contextInfo: {
                                externalAdReply: {
                                    title: "Audio Extracted",
                                    body: "From TikTok video",
                                    thumbnailUrl: "https://files.catbox.moe/5uli5p.jpeg",
                                    mediaType: 1
                                }
                            }
                        },
                        { quoted: response }
                    );
                }

                // Remove listener after handling
                sock.ev.off('messages.upsert', choiceHandler);
            };

            // Listen for reply
            sock.ev.on('messages.upsert', choiceHandler);

            // Auto-remove listener after 1 minute
            setTimeout(() => {
                sock.ev.off('messages.upsert', choiceHandler);
            }, 60000);

        } catch (error) {
            console.error('TikTok Download Error:', error);
            await sock.sendMessage(
                sender,
                { 
                    text: `❌ *Download failed*\nReason: ${error.message || 'Unknown error'}\n\nTry again or use a different link`,
                    contextInfo: {
                        externalAdReply: {
                            title: "Download Error",
                            body: "TikTok download failed",
                            thumbnailUrl: "https://files.catbox.moe/5uli5p.jpeg",
                            mediaType: 1
                        }
                    }
                },
                { quoted: m }
            );
            await sock.sendMessage(
                sender,
                { delete: processingMsg.key }
            );
        }
    }
};

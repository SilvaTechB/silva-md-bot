const axios = require('axios');
const { igdl } = require('ruhend-scraper');

module.exports = {
    name: 'instagram',
    commands: ['instagram', 'igdl', 'ig', 'insta'],
    tags: ['downloader'],
    description: 'Download videos from Instagram',
    handler: async ({ sock, m, sender, args, contextInfo, isGroup }) => {
        try {
            // Validate input
            const url = args[0];
            if (!url || !url.includes('instagram.com')) {
                return sock.sendMessage(
                    sender,
                    { 
                        text: '📸 *Please provide a valid Instagram video URL*\nExample: .ig https://www.instagram.com/p/xyz/',
                        contextInfo: contextInfo
                    },
                    { quoted: m }
                );
            }

            // Send loading message
            const loadingMsg = await sock.sendMessage(
                sender,
                { 
                    text: '⏳ *SILVA MD* is fetching your Instagram video...',
                    contextInfo: {
                        ...contextInfo,
                        externalAdReply: {
                            title: "Instagram Downloader",
                            body: "Processing your request",
                            thumbnailUrl: "https://files.catbox.moe/5uli5p.jpeg",
                            mediaType: 1
                        }
                    }
                },
                { quoted: m }
            );

            // Fetch video data
            const result = await igdl(url);
            
            if (!result?.data?.length) {
                throw new Error('No videos found at this URL');
            }

            // Send videos (limit to 5 to avoid spam)
            const videos = result.data.slice(0, 5);
            for (const vid of videos) {
                if (vid.url) {
                    await sock.sendMessage(
                        sender,
                        {
                            video: { url: vid.url },
                            caption: '🎥 *Instagram Video Downloaded by Silva MD*',
                            contextInfo: {
                                ...contextInfo,
                                externalAdReply: {
                                    title: "Instagram Video",
                                    body: "Downloaded successfully",
                                    thumbnailUrl: "https://files.catbox.moe/5uli5p.jpeg",
                                    mediaType: 1
                                }
                            }
                        },
                        { quoted: m }
                    );
                }
            }

            // Delete loading message
            await sock.sendMessage(
                sender,
                { delete: loadingMsg.key }
            );

        } catch (error) {
            console.error('Instagram Download Error:', error);
            
            await sock.sendMessage(
                sender,
                { 
                    text: '💀 *SILVA SAYS:* Failed to download video\n' + (error.message || 'Try again later'),
                    contextInfo: {
                        ...contextInfo,
                        externalAdReply: {
                            title: "Download Failed",
                            body: "Instagram service error",
                            thumbnailUrl: "https://files.catbox.moe/5uli5p.jpeg",
                            mediaType: 1
                        }
                    }
                },
                { quoted: m }
            );
        }
    }
};

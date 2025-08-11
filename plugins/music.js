const axios = require("axios");
const ytSearch = require("yt-search");

module.exports = {
    commands: ['play', 'music'],
    description: 'Download music from YouTube',
    group: true,
    private: true,
    admin: false,
    
    async run(sock, message, args, context) {
        const { jid, safeSend } = context;
        const query = args.join(' ').trim();
        const quoted = message;
        
        try {
            // Validate query
            if (!query) {
                return await safeSend(sock, jid, {
                    text: '❌ Please provide a song name\nExample: `.play Attention - Charlie Puth`'
                }, { quoted });
            }

            // Processing message
            await safeSend(sock, jid, {
                text: '🔍 *Searching YouTube...*'
            }, { quoted });

            // YouTube search
            const search = await ytSearch(query);
            if (!search.videos.length) {
                return await safeSend(sock, jid, {
                    text: '❌ No results found. Try a different search term.'
                }, { quoted });
            }

            const video = search.videos[0];
            const duration = video.duration.toString();
            
            // Send track info
            await safeSend(sock, jid, {
                image: { url: video.thumbnail },
                caption: `🎵 *${video.title}*\n👤 ${video.author.name}\n⏱ ${duration}\n\n_Downloading audio..._`
            }, { quoted });

            // API endpoints
            const apis = [
                `https://api.davidcyriltech.my.id/youtube/mp3?url=${video.url}`,
                `https://api.ryzendesu.vip/api/downloader/ytmp3?url=${video.url}`,
                `https://api.akuari.my.id/downloader/youtubeaudio?link=${video.url}`
            ];

            let audioUrl = null;
            
            // Try APIs in sequence
            for (const [index, api] of apis.entries()) {
                try {
                    const { data } = await axios.get(api, { timeout: 15000 });
                    
                    if (data.status === 200 || data.success) {
                        audioUrl = data.result?.downloadUrl || data.url || data.result?.url;
                        console.log(`✅ API ${index+1} success: ${audioUrl?.slice(0, 50)}...`);
                        break;
                    }
                } catch (e) {
                    console.error(`❌ API ${index+1} failed: ${e.message}`);
                }
            }

            if (!audioUrl) {
                return await safeSend(sock, jid, {
                    text: '⚠️ All download services are currently unavailable. Please try again later.'
                }, { quoted });
            }

            // Send audio message
            await safeSend(sock, jid, {
                audio: { url: audioUrl },
                mimetype: 'audio/mp4',
                ptt: false
            }, { quoted });

            // Send as downloadable file
            await safeSend(sock, jid, {
                document: { url: audioUrl },
                fileName: `${video.title.replace(/[^\w\s]/gi, '')}.mp3`,
                mimetype: 'audio/mpeg',
                caption: '📥 *Downloadable MP3 File*'
            }, { quoted });

            // Final message
            await safeSend(sock, jid, {
                text: `✅ *Success!* Enjoy your music!\n\n_Song: ${video.title}_\n_Artist: ${video.author.name}_\n_Duration: ${duration}_\n\n🎶 Powered by Silva MD`
            }, { quoted });

        } catch (error) {
            console.error('Music Plugin Error:', error.stack || error);
            await safeSend(sock, jid, {
                text: `❌ Error: ${error.message || 'Failed to process request'}`
            }, { quoted });
        }
    }
};

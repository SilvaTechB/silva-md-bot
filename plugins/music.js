const axios = require("axios");
const ytSearch = require("yt-search");

module.exports = {
    name: 'music',
    description: 'Play music from YouTube',
    group: true,
    private: true,
    
    async run(sock, message, args, context) {
        const { jid, text, safeSend } = context;
        const query = args.join(' ').trim();
        const sender = message.key.participant || jid;
        const quoted = message;

        try {
            if (!query) {
                return await safeSend(sock, jid, {
                    text: '❌ Please provide a song name. Example: `.play attention`'
                }, { quoted });
            }

            // Send processing message
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
            const apis = [
                `https://api.ryzendesu.vip/api/downloader/ytmp3?url=${video.url}`,
                `https://apis.davidcyriltech.my.id/youtube/mp3?url=${video.url}`,
                `https://api.akuari.my.id/downloader/youtubeaudio?link=${video.url}`
            ];

            let audioUrl = null;
            let apiSuccess = false;

            // Try APIs in sequence
            for (const [index, api] of apis.entries()) {
                try {
                    const { data } = await axios.get(api, { timeout: 10000 });
                    
                    if (data.status === 200 || data.success) {
                        audioUrl = data.result?.downloadUrl || data.url || data.result?.url;
                        apiSuccess = true;
                        console.log(`✅ API ${index+1} success: ${api}`);
                        break;
                    }
                } catch (e) {
                    console.error(`❌ API ${index+1} failed: ${e.message}`);
                }
            }

            if (!apiSuccess || !audioUrl) {
                return await safeSend(sock, jid, {
                    text: '⚠️ All download services are currently unavailable. Please try again later.'
                }, { quoted });
            }

            // Send track info
            await safeSend(sock, jid, {
                image: { url: video.thumbnail },
                caption: `🎵 *${video.title}*\n👤 ${video.author.name}\n⏱ ${video.duration.timestamp}\n\n_Downloading audio..._`
            }, { quoted });

            // Send audio
            await safeSend(sock, jid, {
                audio: { url: audioUrl },
                mimetype: 'audio/mp4',
                ptt: false
            }, { quoted });

            // Send as document
            await safeSend(sock, jid, {
                document: { url: audioUrl },
                mimetype: 'audio/mpeg',
                fileName: `${video.title.replace(/[^\w\s]/gi, '')}.mp3`,
                caption: '📁 Audio file'
            }, { quoted });

            // Success message
            await safeSend(sock, jid, {
                text: '✅ *Enjoy your music!* 🎧\n_Powered by Silva MD_'
            }, { quoted });

        } catch (error) {
            console.error('Music Plugin Error:', error);
            await safeSend(sock, jid, {
                text: `❌ Failed to process request:\n${error.message || 'Unknown error'}`
            }, { quoted });
        }
    }
};

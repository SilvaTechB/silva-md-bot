
const axios = require("axios");
const ytSearch = require("yt-search");

module.exports = {
    name: 'music',
    commands: ['play'],
    group: true,
    private: true,
    handler: async ({ sock, m, sender, args, contextInfo }) => {
        try {
            // Extract query from arguments
            const text = args.join(' ');
            if (!text) {
                return sock.sendMessage(sender, {
                    text: '❌ What song do you want to download?',
                    contextInfo: contextInfo
                }, { quoted: m });
            }

            // Send initial processing message
            await sock.sendMessage(sender, {
                text: '🔄 *Silva MD Bot Fetching your audio... Please wait...*',
                contextInfo: contextInfo
            }, { quoted: m });

            // Search YouTube
            const search = await ytSearch(text);
            if (!search.videos.length) {
                return sock.sendMessage(sender, {
                    text: '❌ No results found. Please refine your search.',
                    contextInfo: contextInfo
                }, { quoted: m });
            }

            const video = search.videos[0];
            const link = video.url;
            const apis = [
                `https://apis.davidcyriltech.my.id/download/ytmp3?url=${link}`,
                `https://api.ryzendesu.vip/api/downloader/ytmp3?url=${link}`,
                `https://api.akuari.my.id/downloader/youtubeaudio?link=${link}`
            ];

            let audioUrl = null;
            let songData = null;

            // Try APIs in sequence
            for (const api of apis) {
                try {
                    const { data } = await axios.get(api);
                    
                    if (data.status === 200 || data.success) {
                        audioUrl = data.result?.downloadUrl || data.url;
                        songData = {
                            title: data.result?.title || video.title,
                            artist: data.result?.author || video.author?.name || 'Unknown Artist',
                            thumbnail: data.result?.image || video.thumbnail,
                            videoUrl: link
                        };
                        break;
                    }
                } catch (e) {
                    console.error(`API Error (${api}):`, e.message);
                    continue;
                }
            }

            if (!audioUrl || !songData) {
                return sock.sendMessage(sender, {
                    text: '⚠️ An error occurred. All APIs might be down or unable to process the request.',
                    contextInfo: contextInfo
                }, { quoted: m });
            }

            // Send metadata & thumbnail
            await sock.sendMessage(sender, {
                image: { url: songData.thumbnail },
                caption: `SYLIVANUS THE SILVA MD BOT
╭═════════════════⊷
║ 🎶 *Title:* ${songData.title}
║ 🎤 *Artist:* ${songData.artist}
║ 🔗 THANK YOU SORRY NO URL TO BE SHARED
╰═════════════════⊷
*Powered by SILVA MD BOT*`,
                contextInfo: contextInfo
            }, { quoted: m });

            // Send audio file
            await sock.sendMessage(sender, {
                text: '📤 *Sending your audio...*',
                contextInfo: contextInfo
            }, { quoted: m });

            await sock.sendMessage(sender, {
                audio: { url: audioUrl },
                mimetype: "audio/mpeg",
                contextInfo: contextInfo
            }, { quoted: m });

            // Send document file
            await sock.sendMessage(sender, {
                text: '📤 *Sending your MP3 file...*',
                contextInfo: contextInfo
            }, { quoted: m });

            await sock.sendMessage(sender, {
                document: { url: audioUrl },
                mimetype: "audio/mpeg",
                fileName: `${songData.title.replace(/[^a-zA-Z0-9 ]/g, "")}.mp3`,
                contextInfo: contextInfo
            }, { quoted: m });

            // Send success message
            await sock.sendMessage(sender, {
                text: '✅ *Silva MD – World-class bot just successfully sent you what you requested! 🎶*',
                contextInfo: contextInfo
            }, { quoted: m });

        } catch (error) {
            console.error('Music plugin error:', error);
            sock.sendMessage(sender, {
                text: `❌ Download failed\n${error.message}`,
                contextInfo: contextInfo
            }, { quoted: m });
        }
    }
};

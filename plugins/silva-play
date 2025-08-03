const axios = require("axios");
const ytSearch = require("yt-search");

module.exports = {
    commands: ['audio3', 'spotify', 'ytmusic', 'play', 'song'],
    handler: async ({ sock, m, sender, args, contextInfo }) => {
        try {
            const q = args.join(' ');
            if (!q) {
                return sock.sendMessage(sender, {
                    text: "❌ *Which song should I fetch?* Please provide a song name or keywords.",
                    contextInfo
                }, { quoted: m });
            }

            await sock.sendMessage(sender, {
                text: "🎶 *Silva MD is processing your request...*\n🔍 Searching for your track...",
                contextInfo
            }, { quoted: m });

            const search = await ytSearch(q);
            const video = search.videos?.[0];
            if (!video) {
                return sock.sendMessage(sender, {
                    text: "❌ *No matching songs found.* Try another title.",
                    contextInfo
                }, { quoted: m });
            }

            const link = video.url;
            const apis = [
                `https://apis.davidcyriltech.my.id/youtube/mp3?url=${link}`,
                `https://api.ryzendesu.vip/api/downloader/ytmp3?url=${link}`
            ];

            let audioUrl, songTitle, artistName, thumbnail;
            for (const api of apis) {
                try {
                    const { data } = await axios.get(api);
                    if (data.status === 200 || data.success) {
                        audioUrl = data.result?.downloadUrl || data.url;
                        songTitle = data.result?.title || video.title;
                        artistName = data.result?.author || video.author.name;
                        thumbnail = data.result?.image || video.thumbnail;
                        break;
                    }
                } catch (e) {
                    console.warn(`⚠️ Failed API: ${api}\n${e.message}`);
                    continue;
                }
            }

            if (!audioUrl) {
                return sock.sendMessage(sender, {
                    text: "⚠️ *All available servers failed to fetch your song.* Please try again later.",
                    contextInfo
                }, { quoted: m });
            }

            // ✅ Song Preview
            await sock.sendMessage(sender, {
                image: { url: thumbnail },
                caption: `
🎧 *Now Playing:*
╭─────⊷
│ 🎶 *Title:* ${songTitle}
│ 🎤 *Artist:* ${artistName}
│ 🔗 *Source:* YouTube
╰─────⊷
🪄 _Powered by Silva MD_
                `.trim(),
                contextInfo: {
                    forwardingScore: 999,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: '120363200367779016@newsletter',
                        newsletterName: 'Silva MD Audio Player 🎧',
                        serverMessageId: 144
                    }
                }
            }, { quoted: m });

            await sock.sendMessage(sender, {
                text: "📤 *Uploading high-quality MP3...*",
                contextInfo
            }, { quoted: m });

            // ✅ Send audio
            await sock.sendMessage(sender, {
                audio: { url: audioUrl },
                mimetype: "audio/mp4",
                ptt: false
            });

            // ✅ Send downloadable MP3 as document
            await sock.sendMessage(sender, {
                document: { url: audioUrl },
                mimetype: "audio/mp3",
                fileName: `${songTitle.replace(/[^a-zA-Z0-9 ]/g, "")}.mp3`
            });

            await sock.sendMessage(sender, {
                text: "✅ *Silva MD just sent your requested song!* 🎶 Enjoy the vibes!",
                contextInfo
            }, { quoted: m });

        } catch (error) {
            console.error("❌ Audio Plugin Error:", error.message);
            await sock.sendMessage(sender, {
                text: `🚫 *Oops!* Something went wrong.\n\n🛠 ${error.message}`,
                contextInfo
            }, { quoted: m });
        }
    }
};

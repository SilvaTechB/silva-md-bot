const axios = require('axios');
const ytSearch = require('yt-search');

module.exports = {
    commands: ['audio3', 'spotify', 'ytmusic', 'play', 'song'],
    handler: async ({ sock, m, sender, args, contextInfo }) => {
        if (!args.length) {
            return sock.sendMessage(sender, {
                text: '❌ Which song should I fetch? Provide a song name or keywords.',
                contextInfo
            }, { quoted: m });
        }

        const query = args.join(' ');
        await sock.sendMessage(sender, {
            text: '🎶 *Searching for your track...*\nPlease wait while Silva MD processes your request.',
            contextInfo
        }, { quoted: m });

        try {
            // Search YouTube
            const search = await ytSearch(query);
            const video = search.videos?.[0];
            if (!video) {
                return sock.sendMessage(sender, {
                    text: '❌ No matching songs found. Try another title.',
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
                    const { data } = await axios.get(api, { timeout: 10000 });
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
                    text: '⚠️ All available servers failed to fetch your song. Please try again later.',
                    contextInfo
                }, { quoted: m });
            }

            // ✅ Send Song Preview
            const caption = `
🎧 *Now Playing:*
╭─────⊷
│ 🎶 *Title:* ${songTitle}
│ 🎤 *Artist:* ${artistName}
│ 🔗 *Source:* YouTube
╰─────⊷
🪄 _Delivered by Silva MD Bot_ ✨
            `.trim();

            await sock.sendMessage(sender, {
                image: { url: thumbnail },
                caption,
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

            // ✅ Uploading MP3
            await sock.sendMessage(sender, {
                text: '📤 Uploading high-quality MP3...',
                contextInfo
            }, { quoted: m });

            // ✅ Send Audio Stream
            await sock.sendMessage(sender, {
                audio: { url: audioUrl },
                mimetype: 'audio/mpeg',
                ptt: false,
                contextInfo
            }, { quoted: m });

            // ✅ Send Downloadable File
            await sock.sendMessage(sender, {
                document: { url: audioUrl },
                mimetype: 'audio/mp3',
                fileName: `${songTitle.replace(/[^a-zA-Z0-9 ]/g, '')}.mp3`,
                contextInfo
            }, { quoted: m });

            await sock.sendMessage(sender, {
                text: '✅ Silva MD just sent your requested song! 🎶 Enjoy!',
                contextInfo
            }, { quoted: m });

        } catch (error) {
            console.error('❌ Audio Fetch Error:', error.message);
            await sock.sendMessage(sender, {
                text: `🚫 Oops! Something went wrong.\n\n🛠 ${error.message}`,
                contextInfo
            }, { quoted: m });
        }
    }
};

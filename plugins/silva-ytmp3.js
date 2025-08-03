const axios = require('axios');
const ytSearch = require('yt-search');

module.exports = {
    commands: ['music', 'song', 'ytmp3', 'play'],
    handler: async ({ sock, m, sender, args, contextInfo }) => {
        if (!args.length) {
            return sock.sendMessage(sender, {
                text: '❌ Usage: .music <song name>',
                contextInfo
            }, { quoted: m });
        }

        const query = args.join(' ');
        await sock.sendMessage(sender, {
            text: `🔍 Searching for *${query}*...`,
            contextInfo
        }, { quoted: m });

        try {
            // ✅ Search YouTube
            const search = await ytSearch(query);
            const video = search.videos?.[0];
            if (!video) {
                return sock.sendMessage(sender, {
                    text: '❌ No song found. Try another name.',
                    contextInfo
                }, { quoted: m });
            }

            const link = video.url;
            const title = video.title;
            const thumbnail = video.thumbnail;

            await sock.sendMessage(sender, {
                image: { url: thumbnail },
                caption: `🎧 *Found:* ${title}\n\nDownloading...`,
                contextInfo
            }, { quoted: m });

            // ✅ APIs
            const apis = [
                `https://apis.davidcyriltech.my.id/youtube/mp3?url=${link}`,
                `https://api.ryzendesu.vip/api/downloader/ytmp3?url=${link}`
            ];

            let audioUrl = null;

            for (const api of apis) {
                try {
                    const { data } = await axios.get(api, { timeout: 10000 });
                    if (data.result || data.data) {
                        audioUrl = data.result?.downloadUrl || data.result?.audio || data.url;
                        break;
                    }
                } catch (e) {
                    console.log(`API failed: ${api}`);
                }
            }

            if (!audioUrl) {
                return sock.sendMessage(sender, {
                    text: '❌ Failed to fetch audio. Try later.',
                    contextInfo
                }, { quoted: m });
            }

            // ✅ Send Audio (Stream)
            await sock.sendMessage(sender, {
                audio: { url: audioUrl },
                mimetype: 'audio/mpeg',
                ptt: false,
                contextInfo
            }, { quoted: m });

            // ✅ Send as Document
            await sock.sendMessage(sender, {
                document: { url: audioUrl },
                mimetype: 'audio/mp3',
                fileName: `${title.replace(/[^\w\s]/gi, '')}.mp3`,
                contextInfo
            }, { quoted: m });

            await sock.sendMessage(sender, {
                text: '✅ Song delivered successfully! 🎵',
                contextInfo
            }, { quoted: m });

        } catch (err) {
            console.error('❌ Music Plugin Error:', err.message);
            await sock.sendMessage(sender, {
                text: `🚫 Error: ${err.message}`,
                contextInfo
            }, { quoted: m });
        }
    }
};

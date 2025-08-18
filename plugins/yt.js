const axios = require('axios');
const ytdl = require('ytdl-core');

module.exports = {
    name: 'ytdl',
    commands: ['yt', 'youtube'],
    handler: async ({ sock, m, args, contextInfo }) => {
        const url = args[0];
        if (!url || !ytdl.validateURL(url)) return sock.sendMessage(m.chat, {
            text: '🎬 Invalid YouTube URL!\nExample: .yt https://youtu.be/dQw4w9WgXcQ',
            contextInfo
        }, { quoted: m });

        const info = await ytdl.getInfo(url);
        const format = ytdl.chooseFormat(info.formats, { quality: 'highest' });

        await sock.sendMessage(m.chat, {
            video: { url: format.url },
            caption: `▶️ *${info.videoDetails.title}*\n\n` +
                     `👤 Channel: ${info.videoDetails.author.name}\n` +
                     `⏱ Duration: ${info.videoDetails.lengthSeconds}s\n` +
                     `📊 Views: ${info.videoDetails.viewCount}`,
            contextInfo: {
                ...contextInfo,
                externalAdReply: {
                    title: info.videoDetails.title,
                    body: info.videoDetails.author.name,
                    thumbnailUrl: info.videoDetails.thumbnails[0].url,
                    sourceUrl: url,
                    mediaType: 1,
                    renderLargerThumbnail: true
                }
            }
        }, { quoted: m });
    }
};

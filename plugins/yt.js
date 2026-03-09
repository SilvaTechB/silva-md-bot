'use strict';

const ytdl = require('ytdl-core');

module.exports = {
    commands:    ['yt', 'youtube'],
    description: 'Download a YouTube video',
    permission:  'public',
    group:       true,
    private:     true,
    run: async (sock, message, args, { sender, contextInfo }) => {
        const url = args[0];
        if (!url || !ytdl.validateURL(url)) {
            return sock.sendMessage(sender, {
                text: '🎬 Invalid YouTube URL!\nExample: .yt https://youtu.be/dQw4w9WgXcQ',
                contextInfo
            }, { quoted: message });
        }
        try {
            const info    = await ytdl.getInfo(url);
            const format  = ytdl.chooseFormat(info.formats, { quality: 'highest' });
            const details = info.videoDetails;

            await sock.sendMessage(sender, {
                video:   { url: format.url },
                caption:
`▶️ *${details.title}*

👤 Channel: ${details.author.name}
⏱ Duration: ${Math.floor(details.lengthSeconds / 60)}m ${details.lengthSeconds % 60}s
📊 Views: ${Number(details.viewCount).toLocaleString()}`,
                contextInfo: {
                    ...contextInfo,
                    externalAdReply: {
                        title:               details.title,
                        body:                details.author.name,
                        thumbnailUrl:        details.thumbnails[0]?.url,
                        sourceUrl:           url,
                        mediaType:           1,
                        renderLargerThumbnail: true
                    }
                }
            }, { quoted: message });
        } catch (err) {
            console.error('[YT]', err.message);
            await sock.sendMessage(sender, {
                text: `❌ Failed to download video.\n${err.message}`,
                contextInfo
            }, { quoted: message });
        }
    }
};

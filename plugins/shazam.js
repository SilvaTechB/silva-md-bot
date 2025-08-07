// plugins/shazam.js
const fs = require('fs');
const path = require('path');
const acrcloud = require('acrcloud');
const { getBuffer } = require('../lib/utils');

const acr = new acrcloud({
  host: 'identify-eu-west-1.acrcloud.com',
  access_key: 'c33c767d683f78bd17d4bd4991955d81',
  access_secret: 'bvgaIAEtADBTbLwiPGYlxupWqkNGIjT7J9Ag2vIu',
});

module.exports = {
    name: 'music',
    commands: ['find', 'shazam', 'whatmusic'],
    tags: ['tools'],
    description: 'Identify music from audio clips',
    handler: async ({ sock, m, sender, quoted }) => {
        const tempDir = path.join(__dirname, '../../temp');
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }

        const getContextInfo = (title = "Silva MD Music Recognition", body = "Powered by ACRCloud") => ({
            externalAdReply: {
                title: title.length > 20 ? title.substring(0, 20) + "..." : title,
                body: body.length > 30 ? body.substring(0, 30) + "..." : body,
                thumbnailUrl: "https://files.catbox.moe/5uli5p.jpeg",
                mediaType: 1,
                mediaUrl: "",
                sourceUrl: "https://github.com/SilvaTeam/Silva-MD",
                showAdAttribution: true
            }
        });

        try {
            const q = quoted || m;
            const mime = q.mimetype || (q.msg ? q.msg.mimetype : '');
            
            if (!mime || !/(audio|video)/i.test(mime)) {
                return await sock.sendMessage(
                    sender,
                    {
                        text: '🎵 *How to use music recognition*:\n\n1. Send or reply to a voice note\n2. Send or reply to an audio file\n3. Send or reply to a video with music\n\nExample: Reply to an audio with *.shazam*',
                        contextInfo: getContextInfo("Invalid Media", "Send audio to identify")
                    },
                    { quoted: m }
                );
            }

            // Download media
            let media;
            try {
                media = await sock.downloadMediaMessage(q);
                if (!media || media.length < 1024) {
                    throw new Error('Audio too small or corrupted');
                }
            } catch (e) {
                throw new Error('Failed to download audio: ' + e.message);
            }

            // Save to temp file
            const ext = mime.split('/')[1] || 'mp3';
            const tempFile = path.join(tempDir, `shazam-${Date.now()}.${ext}`);
            fs.writeFileSync(tempFile, media);

            // Recognize music
            let res;
            try {
                res = await Promise.race([
                    acr.identify(fs.readFileSync(tempFile)),
                    new Promise((_, reject) => 
                        setTimeout(() => reject(new Error('Recognition timeout (15s)')), 15000)
                ]);
            } catch (e) {
                fs.unlinkSync(tempFile);
                throw new Error('Recognition failed: ' + e.message);
            }

            if (!res.metadata?.music?.length) {
                fs.unlinkSync(tempFile);
                throw new Error('No music recognized in this audio');
            }

            const { title, artists, album, genres, release_date } = res.metadata.music[0];
            const artistNames = artists?.map(v => v.name).join(', ') || 'Unknown Artist';
            const genreNames = genres?.map(v => v.name).join(', ') || 'Unknown Genre';

            // Format result
            const resultText = `
🎶 *MUSIC RECOGNIZED* 🎶

• *Title*: ${title || 'Unknown'}
• *Artist*: ${artistNames}
• *Album*: ${album?.name || 'Unknown'}
• *Genre*: ${genreNames}
• *Released*: ${release_date || 'Unknown'}

🔍 *Powered by Silva MD*
            `.trim();

            // Send result with rich preview
            await sock.sendMessage(
                sender,
                {
                    text: resultText,
                    contextInfo: getContextInfo(
                        title || "Music Found",
                        artistNames
                    )
                },
                { quoted: m }
            );

            fs.unlinkSync(tempFile);

        } catch (error) {
            console.error('Music Recognition Error:', error);
            await sock.sendMessage(
                sender,
                {
                    text: `❌ *Recognition Failed*\n\nReason: ${error.message}\n\nTips:\n• Use clear 10-30 second audio\n• Avoid background noise\n• Supported formats: MP3, OGG, M4A`,
                    contextInfo: getContextInfo("Recognition Failed", "Try again with better audio")
                },
                { quoted: m }
            );
        }
    }
};

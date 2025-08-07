// plugins/shazam.js
const fs = require('fs');
const acrcloud = require('acrcloud');

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
        try {
            const q = quoted || m;
            const mime = (q.msg || q).mimetype || '';
            
            if (!/audio|video/.test(mime)) {
                throw '⚠️ Please reply to an audio or video message containing music';
            }

            // Download media
            const media = await sock.downloadMediaMessage(q);
            const ext = mime.split('/')[1];
            const filePath = `./tmp/${sender}.${ext}`;
            
            fs.writeFileSync(filePath, media);
            
            // Identify music
            const res = await acr.identify(fs.readFileSync(filePath));
            const { code, msg } = res.status;
            
            if (code !== 0) {
                fs.unlinkSync(filePath);
                throw `❌ Identification failed: ${msg}`;
            }

            const { title, artists, album, genres, release_date } = res.metadata.music[0];
            
            // Format response
            const resultText = `
🎵 *MUSIC IDENTIFICATION RESULT* 🎵

• 📌 *Title*: ${title || 'Not found'}
• 👨‍🎤 *Artist(s)*: ${artists?.map(v => v.name).join(', ') || 'Not found'}
• 💿 *Album*: ${album?.name || 'Not found'}
• 🎼 *Genre(s)*: ${genres?.map(v => v.name).join(', ') || 'Not found'}
• 📅 *Release Date*: ${release_date || 'Not found'}

🔍 Powered by Silva MD Music Recognition
            `.trim();

            // Clean up and send result
            fs.unlinkSync(filePath);
            await sock.sendMessage(
                sender,
                { 
                    text: resultText,
                    contextInfo: {
                        externalAdReply: {
                            title: "🎶 Music Found!",
                            body: "Silva MD Music Recognition",
                            thumbnailUrl: "https://files.catbox.moe/5uli5p.jpeg",
                            mediaType: 1
                        }
                    }
                },
                { quoted: m }
            );

        } catch (error) {
            console.error('Music Recognition Error:', error);
            await sock.sendMessage(
                sender,
                { 
                    text: `❌ Error: ${error.message || error}\n\nPlease try again with a clear audio clip.`,
                    contextInfo: {
                        externalAdReply: {
                            title: "Music Recognition Failed",
                            body: "Try with better audio quality",
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

// plugins/shazam.js
const fs = require('fs');
const acrcloud = require('acrcloud');
const { getBuffer } = require('../lib/utils'); // Ensure this exists

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
            const type = m.mtype || (q.msg ? q.msg.mimetype : '');
            
            // Enhanced media type detection
            if (!type || !/(audio|video)/i.test(type)) {
                return await sock.sendMessage(
                    sender,
                    { 
                        text: '🎵 *How to use music recognition*:\n\n1. Send or reply to a voice note\n2. Send or reply to an audio file\n3. Send or reply to a video with music\n\n⚠️ Note: Works best with clear music (10-30 seconds)',
                        contextInfo: {
                            externalAdReply: {
                                title: "Silva MD Music Recognition",
                                body: "Proper usage instructions",
                                thumbnailUrl: "https://files.catbox.moe/5uli5p.jpeg",
                                mediaType: 1
                            }
                        }
                    },
                    { quoted: m }
                );
            }

            // Download media using your BufferFile setup
            let mediaBuffer;
            try {
                const mediaData = await sock.downloadMediaMessage(q);
                mediaBuffer = Buffer.from(mediaData);
                if (!mediaBuffer || mediaBuffer.length < 1024) {
                    throw new Error('Audio too small or corrupted');
                }
            } catch (downloadError) {
                throw new Error('Failed to process audio: ' + downloadError.message);
            }

            // Temporary file handling with your File class
            const tempFileName = `./tmp/music-${Date.now()}.${type.split('/')[1] || 'mp3'}`;
            
            try {
                // Write using your File class
                const tempFile = new global.File([mediaBuffer], tempFileName);
                fs.writeFileSync(tempFileName, tempFile);

                // Identify music with timeout
                const res = await Promise.race([
                    acr.identify(fs.readFileSync(tempFileName)),
                    new Promise((_, reject) => 
                        setTimeout(() => reject(new Error('Recognition timeout')), 15000)
                ]);

                if (!res.metadata?.music?.length) {
                    throw new Error('No music recognized');
                }

                const { title, artists, album, genres, release_date } = res.metadata.music[0];
                
                // Format results
                const resultText = `
🎶 *Music Recognition Result*:

• 🎵 *Title*: ${title || 'Unknown'}
• 🎤 *Artist*: ${artists?.map(v => v.name).join(', ') || 'Unknown'}
• 💿 *Album*: ${album?.name || 'Unknown'}
• 🎼 *Genre*: ${genres?.map(v => v.name).join(', ') || 'Unknown'}
• 📅 *Released*: ${release_date || 'Unknown'}

🔍 Powered by Silva MD
                `.trim();

                await sock.sendMessage(
                    sender,
                    { 
                        text: resultText,
                        contextInfo: {
                            externalAdReply: {
                                title: title || "Music Found",
                                body: artists?.map(v => v.name).join(', ') || "Unknown Artist",
                                thumbnailUrl: "https://files.catbox.moe/5uli5p.jpeg",
                                mediaType: 1
                            }
                        }
                    },
                    { quoted: m }
                );

            } finally {
                // Cleanup temp file
                if (fs.existsSync(tempFileName)) {
                    fs.unlinkSync(tempFileName);
                }
            }

        } catch (error) {
            console.error('Music Recognition Error:', error);
            await sock.sendMessage(
                sender,
                { 
                    text: `❌ *Recognition Failed*\n\nReason: ${error.message}\n\nTips:\n• Use clear audio without background noise\n• Try 10-30 second clips\n• Supported formats: MP3, OGG, M4A`,
                    contextInfo: {
                        externalAdReply: {
                            title: "Recognition Error",
                            body: "Try again with better audio",
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

const axios = require('axios');
const fg = require('api-dylux');

module.exports = {
    name: 'facebook',
    commands: ['facebook', 'fb', 'fbdl'],
    handler: async ({ sock, m, sender, args, usedPrefix, command, contextInfo }) => {
        try {
            if (!args[0]) {
                throw `✳️ Please send the link of a Facebook video\n\n📌 EXAMPLE :\n*${usedPrefix + command}* https://www.facebook.com/Ankursajiyaan/videos/981948876160874/?mibextid=rS40aB7S9Ucbxw6v`;
            }

            const urlRegex = /^(?:https?:\/\/)?(?:www\.)?(?:facebook\.com|fb\.watch)\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/i;
            if (!urlRegex.test(args[0])) {
                throw '⚠️ PLEASE GIVE A VALID URL.';
            }

            // Show loading message
            await sock.sendMessage(sender, {
                text: '📥 Downloading Facebook video...',
                contextInfo: contextInfo
            }, { quoted: m });

            const result = await fg.fbdl(args[0]);
            const tex = `
> 🦋 FACEBOOK DOWNLOAD 🦋 ⊰\n\n
> *VIDEO TITLE:* ${result.title}\n\n
> THANKS FOR CHOOSING SILVA MD`;

            const response = await axios.get(result.videoUrl, { responseType: 'arraybuffer' });
            const videoBuffer = Buffer.from(response.data);

            await sock.sendMessage(sender, {
                video: videoBuffer,
                caption: tex,
                contextInfo: {
                    ...contextInfo,
                    externalAdReply: {
                        title: "Facebook Video Downloader",
                        body: "Powered by Silva MD",
                        thumbnailUrl: "https://files.catbox.moe/5uli5p.jpeg",
                        sourceUrl: args[0],
                        mediaType: 1,
                        renderLargerThumbnail: true
                    }
                }
            }, { quoted: m });

        } catch (error) {
            console.error('❌ Facebook Downloader Error:', error);
            await sock.sendMessage(sender, {
                text: '⚠️ An error occurred while processing the request. Please try again later.',
                contextInfo: contextInfo
            }, { quoted: m });
        }
    }
};

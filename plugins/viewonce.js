// plugins/viewonce.js
const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'viewonce',
    commands: ['vv'],
    handler: async ({ sock, m, sender, contextInfo }) => {
        try {
            // Check if message is a reply
            if (!m.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
                return sock.sendMessage(sender, {
                    text: '❌ Please reply to a view-once message with .vv',
                    contextInfo: contextInfo
                }, { quoted: m });
            }

            const quoted = m.message.extendedTextMessage.contextInfo.quotedMessage;
            let viewOnceType = null;
            let mediaContent = null;

            // Detect view-once message type
            if (quoted.viewOnceMessage?.message?.imageMessage) {
                viewOnceType = 'image';
                mediaContent = quoted.viewOnceMessage.message.imageMessage;
            } else if (quoted.viewOnceMessage?.message?.videoMessage) {
                viewOnceType = 'video';
                mediaContent = quoted.viewOnceMessage.message.videoMessage;
            } else if (quoted.viewOnceMessage?.message?.audioMessage) {
                viewOnceType = 'audio';
                mediaContent = quoted.viewOnceMessage.message.audioMessage;
            } else if (quoted.viewOnceMessage?.message?.documentMessage) {
                viewOnceType = 'document';
                mediaContent = quoted.viewOnceMessage.message.documentMessage;
            } else {
                return sock.sendMessage(sender, {
                    text: '❌ This is not a view-once media message',
                    contextInfo: contextInfo
                }, { quoted: m });
            }

            // Download media
            const buffer = await sock.downloadMediaMessage(m.message.extendedTextMessage.contextInfo.stanzaId);
            if (!buffer) throw new Error('Failed to download media');

            // Create temp directory if not exists
            const tempDir = path.join(__dirname, '../temp');
            if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

            // Save to temp file
            const filename = `viewonce-${Date.now()}.${viewOnceType === 'image' ? 'jpg' : viewOnceType === 'video' ? 'mp4' : viewOnceType === 'audio' ? 'ogg' : 'bin'}`;
            const filePath = path.join(tempDir, filename);
            fs.writeFileSync(filePath, buffer);

            // Prepare caption
            const caption = `🔍 *View Once Restored*\n\n` +
                `*Type:* ${viewOnceType.toUpperCase()}\n` +
                `*Restored By:* @${sender.split('@')[0]}\n\n` +
                `⚠️ This message was originally sent as view-once`;

            // Prepare message options
            const messageOptions = {
                caption,
                contextInfo: {
                    ...contextInfo,
                    mentionedJid: [sender],
                    externalAdReply: {
                        title: "Silva MD View Once",
                        body: "View-once message restored",
                        thumbnailUrl: "https://files.catbox.moe/5uli5p.jpeg",
                        sourceUrl: "https://github.com/SilvaTechB/silva-md-bot",
                        mediaType: 1,
                        renderLargerThumbnail: true
                    }
                }
            };

            // Send restored media based on type
            switch (viewOnceType) {
                case 'image':
                    await sock.sendMessage(sender, {
                        image: fs.readFileSync(filePath),
                        ...messageOptions
                    }, { quoted: m });
                    break;
                
                case 'video':
                    await sock.sendMessage(sender, {
                        video: fs.readFileSync(filePath),
                        ...messageOptions
                    }, { quoted: m });
                    break;
                
                case 'audio':
                    await sock.sendMessage(sender, {
                        audio: fs.readFileSync(filePath),
                        mimetype: mediaContent.mimetype || 'audio/ogg',
                        ...messageOptions
                    }, { quoted: m });
                    break;
                
                case 'document':
                    await sock.sendMessage(sender, {
                        document: fs.readFileSync(filePath),
                        fileName: mediaContent.fileName || `restored-viewonce.${mediaContent.mimetype.split('/')[1]}`,
                        mimetype: mediaContent.mimetype,
                        ...messageOptions
                    }, { quoted: m });
                    break;
            }

            // Delete temp file
            fs.unlinkSync(filePath);

        } catch (err) {
            console.error('ViewOnce plugin error:', err);
            sock.sendMessage(sender, {
                text: `❌ Failed to restore view-once message: ${err.message}`,
                contextInfo: contextInfo
            }, { quoted: m });
        }
    }
};

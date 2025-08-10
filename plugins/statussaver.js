const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'status-saver',
    commands: [], // Automatic - no commands needed
    desc: 'Automatically likes and saves status updates',
    handler: async () => {}, // No direct command handler needed
    events: {
        'messages.upsert': async ({ messages, sock, store, config }) => {
            try {
                const message = messages[0];
                if (!message) return;
                
                // Check if AUTO_STATUS_LIKE is enabled
                const autoStatusLike = config.AUTO_STATUS_LIKE === "true";
                if (!autoStatusLike) {
                    console.log("AUTO_STATUS_LIKE is disabled. Skipping status like.");
                    return;
                }

                // Check if message is from status broadcast
                if (message.key.remoteJid !== 'status@broadcast') return;

                const likeEmoji = config.AUTO_STATUS_LIKE_EMOJI || "💚";
                const botJid = sock.user.id;
                const sender = message.key.participant;

                // Auto-like status
                if (autoStatusLike) {
                    await sock.sendMessage(message.key.remoteJid, {
                        react: {
                            key: message.key,
                            text: likeEmoji,
                        },
                    }, {
                        statusJidList: [sender, botJid],
                    });
                }

                // Check if Status Saver is enabled
                if (config.Status_Saver !== 'true') {
                    console.log("Status Saver is disabled.");
                    return;
                }

                const userName = await sock.getName(sender) || "Unknown";
                const statusHeader = "AUTO STATUS SAVER"; // Decoded from base64
                let caption = `${statusHeader}\n\n*🩵 Status From:* ${userName}`;

                // Message type detection
                const msgType = Object.keys(message.message)[0];
                const saveDir = path.join(__dirname, 'status_saver');
                if (!fs.existsSync(saveDir)) fs.mkdirSync(saveDir);

                // Handle different message types
                switch (msgType) {
                    case 'imageMessage':
                    case 'videoMessage':
                        caption += `\n*🩵 Caption:* ${message.message[msgType]?.caption || ''}`;
                        await saveMedia(message, msgType, sock, saveDir, caption);
                        break;
                        
                    case 'audioMessage':
                        caption += `\n*🩵 Audio Status*`;
                        await saveMedia(message, msgType, sock, saveDir, caption);
                        break;
                        
                    case 'extendedTextMessage':
                        caption = `${statusHeader}\n\n${message.message.extendedTextMessage.text}`;
                        await sock.sendMessage(botJid, { text: caption });
                        break;
                        
                    default:
                        console.log("Unsupported status type:", msgType);
                        return;
                }

                // Send confirmation to user
                if (config.STATUS_REPLY?.toLowerCase() === "true") {
                    const replyMsg = config.STATUS_MSG || "SILVA MD 💖 SUCCESSFULLY VIEWED YOUR STATUS";
                    await sock.sendMessage(sender, { text: replyMsg });
                }

            } catch (error) {
                console.error("Status Saver Error:", error);
            }
        }
    }
};

async function saveMedia(message, msgType, sock, saveDir, caption) {
    try {
        const stream = await downloadContentFromMessage(message.message[msgType], msgType.replace('Message', ''));
        let buffer = Buffer.from([]);
        
        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk]);
        }
        
        // Determine file extension
        const extMap = {
            imageMessage: 'jpg',
            videoMessage: 'mp4',
            audioMessage: 'ogg'
        };
        
        const filename = `${Date.now()}.${extMap[msgType]}`;
        const filePath = path.join(saveDir, filename);
        fs.writeFileSync(filePath, buffer);
        
        // Send to bot's own chat
        await sock.sendMessage(sock.user.id, {
            [msgType.replace('Message', '')]: { url: filePath },
            caption: caption,
            mimetype: message.message[msgType].mimetype
        });
        
    } catch (error) {
        console.error("Media Save Error:", error);
    }
}

// 🌟 Silva MD Plugin — View Once Media Opener (by Bilal, fixed for Silva MD)
const { downloadContentFromMessage } = require("@whiskeysockets/baileys");

module.exports = {
    commands: ['vv', 'antivv', 'avv', 'viewonce', 'open', 'openphoto', 'openvideo', 'vvphoto'],
    handler: async ({ sock, m, sender, contextInfo = {} }) => {
        try {
            const fromMe = m.key.fromMe;
            const isCreator = fromMe;
            const quoted = m.quoted ? m.quoted : m.message?.extendedTextMessage?.contextInfo?.quotedMessage;

            // Initial react 😃
            await sock.sendMessage(sender, { react: { text: '😃', key: m.key } });

            // Owner-only check
            if (!isCreator) return;

            // If no media is replied to
            if (!quoted) {
                await sock.sendMessage(sender, { react: { text: '😊', key: m.key } });
                return await sock.sendMessage(sender, {
                    text: `*SOMEONE SENT YOU A PRIVATE PHOTO, VIDEO, OR AUDIO 🥺 AND YOU WANT TO VIEW IT 🤔*\n\n*THEN WRITE LIKE THIS ☺️*\n\n*❮VV❯*\n\n*THEN THE PRIVATE PHOTO, VIDEO, OR AUDIO WILL OPEN FOR YOU ☺️ 🥰*`,
                    contextInfo
                }, { quoted: m });
            }

            // Detect the type of quoted message
            let type = quoted.msg ? quoted.msg.mimetype ? (quoted.msg.mimetype.startsWith('image') ? 'imageMessage'
                : quoted.msg.mimetype.startsWith('video') ? 'videoMessage'
                : quoted.msg.mimetype.startsWith('audio') ? 'audioMessage'
                : null) : Object.keys(quoted.msg)[0]
                : Object.keys(quoted)[0];

            if (!["imageMessage", "videoMessage", "audioMessage"].includes(type)) {
                await sock.sendMessage(sender, { react: { text: '🥺', key: m.key } });
                return await sock.sendMessage(sender, {
                    text: `*JUST MENTION THE PHOTO, VIDEO, OR AUDIO 🥺*\n*THAT’S ALL YOU NEED TO DO 💫*`,
                    contextInfo
                }, { quoted: m });
            }

            // Extract proper message object
            const msgContent = quoted.msg ? quoted.msg : quoted[type] ? quoted[type] : quoted;

            // Download media content
            const stream = await downloadContentFromMessage(msgContent, type.replace('Message', ''));
            let buffer = Buffer.from([]);
            for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);

            // Prepare and send back
            if (type === 'imageMessage') {
                await sock.sendMessage(sender, {
                    image: buffer,
                    caption: msgContent?.caption || "",
                    mimetype: msgContent?.mimetype || "image/jpeg"
                }, { quoted: m });
            } else if (type === 'videoMessage') {
                await sock.sendMessage(sender, {
                    video: buffer,
                    caption: msgContent?.caption || "",
                    mimetype: msgContent?.mimetype || "video/mp4"
                }, { quoted: m });
            } else if (type === 'audioMessage') {
                await sock.sendMessage(sender, {
                    audio: buffer,
                    mimetype: msgContent?.mimetype || "audio/mp4",
                    ptt: msgContent?.ptt || false
                }, { quoted: m });
            }

            // React on success
            await sock.sendMessage(sender, { react: { text: '😍', key: m.key } });

        } catch (error) {
            console.error("VV Error:", error);
            await sock.sendMessage(sender, { react: { text: '😔', key: m.key } });
            await sock.sendMessage(sender, {
                text: `*TYPE ❮VV❯ AGAIN 🥺*\n*AND TRY ONCE MORE 💫*\n\n_Error:_ ${error.message}`,
                contextInfo
            }, { quoted: m });
        }
    }
};

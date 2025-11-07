// 🌟 Silva MD Plugin — View Once Media Opener (by Bilal, adapted by Silva Tech Inc)
const { downloadContentFromMessage } = require("@whiskeysockets/baileys");

module.exports = {
    commands: ['vv', 'antivv', 'avv', 'viewonce', 'open', 'openphoto', 'openvideo', 'vvphoto'],
    handler: async ({ sock, m, sender, contextInfo = {} }) => {
        try {
            const fromMe = m.key.fromMe;
            const isCreator = fromMe; // Silva MD treats fromMe as owner check
            const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;

            // Initial react 😃
            await sock.sendMessage(sender, { react: { text: '😃', key: m.key } });

            // Owner-only check
            if (!isCreator) return;

            // If no reply was made
            if (!quoted) {
                await sock.sendMessage(sender, { react: { text: '😊', key: m.key } });
                return await sock.sendMessage(sender, {
                    text: `*SOMEONE SENT YOU A PRIVATE PHOTO, VIDEO, OR AUDIO 🥺 AND YOU WANT TO VIEW IT 🤔*\n\n*THEN WRITE LIKE THIS ☺️*\n\n*❮VV❯*\n\n*THEN THE PRIVATE PHOTO, VIDEO, OR AUDIO WILL OPEN FOR YOU ☺️ 🥰*`,
                    contextInfo
                }, { quoted: m });
            }

            // Detect media type
            let type = Object.keys(quoted)[0];
            if (!["imageMessage", "videoMessage", "audioMessage"].includes(type)) {
                await sock.sendMessage(sender, { react: { text: '🥺', key: m.key } });
                return await sock.sendMessage(sender, {
                    text: `*JUST MENTION THE PHOTO, VIDEO, OR AUDIO 🥺*\n*THAT’S ALL YOU NEED TO DO 💫*`,
                    contextInfo
                }, { quoted: m });
            }

            // Download the media
            const stream = await downloadContentFromMessage(quoted[type], type.replace("Message", ""));
            let buffer = Buffer.from([]);
            for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);

            // Prepare response message
            let sendContent = {};
            if (type === "imageMessage") {
                sendContent = {
                    image: buffer,
                    caption: quoted[type]?.caption || "",
                    mimetype: quoted[type]?.mimetype || "image/jpeg"
                };
            } else if (type === "videoMessage") {
                sendContent = {
                    video: buffer,
                    caption: quoted[type]?.caption || "",
                    mimetype: quoted[type]?.mimetype || "video/mp4"
                };
            } else if (type === "audioMessage") {
                sendContent = {
                    audio: buffer,
                    mimetype: quoted[type]?.mimetype || "audio/mp4",
                    ptt: quoted[type]?.ptt || false
                };
            }

            // Send back the retrieved media
            await sock.sendMessage(sender, sendContent, { quoted: m });

            // React after success 😍
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

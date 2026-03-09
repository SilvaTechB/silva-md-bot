'use strict';

const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const config = require('../config');

// In-memory toggle — seeded from config, changeable at runtime
if (typeof global.antivvEnabled === 'undefined') {
    global.antivvEnabled = config.ANTIVV !== false;
}

module.exports = {
    commands:    ['vv', 'viewonce', 'open', 'openphoto', 'openvideo', 'vvphoto'],
    description: 'Manually reveal a view-once message (reply to it)',
    permission:  'owner',
    group:       true,
    private:     true,

    run: async (sock, message, args, { sender, contextInfo }) => {
        const quoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        if (!quoted) {
            return sock.sendMessage(sender, {
                text: '❌ *Reply to a view-once photo / video / audio with this command.*',
                contextInfo
            }, { quoted: message });
        }

        let type = null;
        for (const k of ['imageMessage', 'videoMessage', 'audioMessage']) {
            if (quoted[k]) { type = k; break; }
        }

        if (!type) {
            return sock.sendMessage(sender, {
                text: '❌ Quoted message has no image, video, or audio.',
                contextInfo
            }, { quoted: message });
        }

        try {
            const msgContent = quoted[type];
            const stream = await downloadContentFromMessage(msgContent, type.replace('Message', ''));
            let buffer = Buffer.alloc(0);
            for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);

            if (type === 'imageMessage') {
                await sock.sendMessage(sender, {
                    image:    buffer,
                    caption:  msgContent?.caption || '',
                    mimetype: msgContent?.mimetype || 'image/jpeg'
                }, { quoted: message });
            } else if (type === 'videoMessage') {
                await sock.sendMessage(sender, {
                    video:    buffer,
                    caption:  msgContent?.caption || '',
                    mimetype: msgContent?.mimetype || 'video/mp4'
                }, { quoted: message });
            } else if (type === 'audioMessage') {
                await sock.sendMessage(sender, {
                    audio:    buffer,
                    mimetype: msgContent?.mimetype || 'audio/mp4',
                    ptt:      msgContent?.ptt || false
                }, { quoted: message });
            }

            await sock.sendMessage(sender, { react: { text: '😍', key: message.key } });
        } catch (err) {
            await sock.sendMessage(sender, { react: { text: '😔', key: message.key } });
            await sock.sendMessage(sender, {
                text: `❌ Failed to open media: ${err.message}`,
                contextInfo
            }, { quoted: message });
        }
    }
};

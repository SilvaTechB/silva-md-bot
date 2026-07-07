'use strict';
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

module.exports = {
    commands:    ['tojpeg', 'toimg', 'stickertoimg', 'unwebp'],
    description: 'Convert sticker to JPEG image',
    permission:  'public',
    group:       true,
    private:     true,
    run: async (sock, message, args, { sender, contextInfo }) => {
        const ctx        = message.message?.extendedTextMessage?.contextInfo;
        const quoted     = ctx?.quotedMessage;
        const stickerMsg = quoted?.stickerMessage || message.message?.stickerMessage;
        if (!stickerMsg) {
            return sock.sendMessage(sender, {
                text: '🖼️ Reply to a sticker with .tojpeg to convert it.',
                contextInfo
            }, { quoted: message });
        }
        try {
            const stream = await downloadContentFromMessage(stickerMsg, 'sticker');
            let buf = Buffer.from([]);
            for await (const chunk of stream) buf = Buffer.concat([buf, chunk]);
            await sock.sendMessage(sender, {
                image:    buf,
                mimetype: 'image/webp',
                caption:  '🖼️ *Sticker converted to image*\n_Powered by Silva MD_',
                contextInfo
            }, { quoted: message });
        } catch (e) {
            await sock.sendMessage(sender, { text: `❌ Conversion failed: ${e.message}`, contextInfo }, { quoted: message });
        }
    }
};

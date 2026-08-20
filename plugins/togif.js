'use strict';
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

module.exports = {
    commands:    ['togif', 'gif', 'mp4togif'],
    description: 'Convert sticker or video to GIF',
    permission:  'public',
    group:       true,
    private:     true,
    run: async (sock, message, args, { sender, contextInfo }) => {
        const ctx     = message.message?.extendedTextMessage?.contextInfo;
        const quoted  = ctx?.quotedMessage;
        const stickerMsg = quoted?.stickerMessage || message.message?.stickerMessage;
        const videoMsg   = quoted?.videoMessage   || message.message?.videoMessage;
        const target     = stickerMsg || videoMsg;
        const typeHint   = stickerMsg ? 'sticker' : 'video';
        if (!target) {
            return sock.sendMessage(sender, {
                text: '🎞️ Reply to a sticker or video with .togif to convert it to GIF.',
                contextInfo
            }, { quoted: message });
        }
        await sock.sendMessage(sender, { text: '⏳ Converting to GIF...', contextInfo }, { quoted: message });
        try {
            const stream = await downloadContentFromMessage(target, typeHint);
            let buf = Buffer.from([]);
            for await (const chunk of stream) buf = Buffer.concat([buf, chunk]);
            await sock.sendMessage(sender, {
                video:     buf,
                gifPlayback: true,
                mimetype:  'video/mp4',
                contextInfo
            }, { quoted: message });
        } catch (e) {
            await sock.sendMessage(sender, { text: `❌ GIF conversion failed: ${e.message}`, contextInfo }, { quoted: message });
        }
    }
};

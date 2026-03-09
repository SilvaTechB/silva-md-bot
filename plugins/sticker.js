'use strict';

const { createSticker, StickerTypes } = require('wa-sticker-formatter');
const config = require('../config');

module.exports = {
    commands:    ['sticker', 's'],
    description: 'Convert an image or video to a WhatsApp sticker',
    permission:  'public',
    group:       true,
    private:     true,
    run: async (sock, message, args, { sender, contextInfo }) => {
        const msg = message.message;
        if (!msg?.imageMessage && !msg?.videoMessage) {
            return sock.sendMessage(sender, {
                text: '❌ Please send an *image or video* with the caption `.sticker`',
                contextInfo
            }, { quoted: message });
        }

        try {
            const mediaType = msg.imageMessage ? 'image' : 'video';
            const buffer    = await sock.downloadMediaMessage(message);

            const sticker = await createSticker(buffer, {
                pack:       config.BOT_NAME || 'Silva MD',
                author:     'Silva MD',
                type:       mediaType === 'image' ? StickerTypes.FULL : StickerTypes.CROPPED,
                categories: ['🤩', '🎉'],
                quality:    50,
                background: '#00000000'
            });

            await sock.sendMessage(sender, sticker, { quoted: message });
        } catch (err) {
            console.error('[Sticker]', err.message);
            await sock.sendMessage(sender, {
                text: '❌ Failed to create sticker. Please try again.',
                contextInfo
            }, { quoted: message });
        }
    }
};

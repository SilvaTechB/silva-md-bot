'use strict';

const { Sticker }     = require('wa-sticker-formatter');
const config          = require('../config');
const { getStr, fmt } = require('../lib/theme');
const { dlBuffer }    = require('../lib/dlmedia');

module.exports = {
    commands:    ['sticker', 's'],
    description: 'Convert an image or video to a WhatsApp sticker',
    permission:  'public',
    group:       true,
    private:     true,

    run: async (sock, message, args, { jid, contextInfo, reply }) => {
        const msg = message.message;

        const imgMsg    = msg?.imageMessage;
        const vidMsg    = msg?.videoMessage;
        const quotedMsg = msg?.extendedTextMessage?.contextInfo?.quotedMessage;
        const qImg      = quotedMsg?.imageMessage;
        const qVid      = quotedMsg?.videoMessage;

        const target    = imgMsg || vidMsg || qImg || qVid;
        const mediaType = (imgMsg || qImg) ? 'image' : (vidMsg || qVid) ? 'video' : null;

        if (!target || !mediaType) {
            return reply(fmt('❌ Send or reply to an *image* or *video* with `.sticker`'));
        }

        try {
            await sock.sendPresenceUpdate('composing', jid);

            const buffer = await dlBuffer(target, mediaType);

            const packName = config.BOT_NAME || getStr('botName') || 'Silva MD';
            const sticker  = new Sticker(buffer, {
                pack:     packName,
                author:   packName,
                animated: mediaType === 'video',
                crop:     true,
            });

            await sticker.build();
            const stickerBuffer = await sticker.get();

            await sock.sendMessage(jid, {
                sticker: stickerBuffer,
            }, { quoted: message });

            await sock.sendPresenceUpdate('paused', jid);

        } catch (err) {
            console.error('[Sticker]', err.message);
            await reply(fmt(`❌ Failed to create sticker: ${err.message}`));
        }
    }
};

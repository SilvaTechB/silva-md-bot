'use strict';
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const { Jimp } = require('jimp');
const { fmt } = require('../lib/theme');

async function toBuffer(msgObj, type) {
    const stream = await downloadContentFromMessage(msgObj, type);
    let buf = Buffer.alloc(0);
    for await (const chunk of stream) buf = Buffer.concat([buf, chunk]);
    return buf;
}

// Pre-process to exactly 640×640 cover-fill using jimp (pure JS — works everywhere)
async function prepareDP(inputBuffer) {
    const img = await Jimp.fromBuffer(inputBuffer);
    img.cover({ w: 640, h: 640 });                          // zoom & fill, no bars
    return img.getBuffer('image/jpeg', { quality: 90 });    // high quality JPEG
}

module.exports = {
    commands:    ['setdp', 'setpp', 'setpfp', 'changdp', 'updatedp'],
    description: "Set the bot's profile picture — fills the circle edge-to-edge",
    usage:       '.setdp  (attach an image, or reply to one)',
    permission:  'owner',
    group:       false,
    private:     true,

    run: async (sock, message, args, ctx) => {
        const { jid, contextInfo } = ctx;
        const reply = (text) => sock.sendMessage(jid, { text: fmt(text), contextInfo }, { quoted: message });

        const msg = message.message;

        const directImg = msg?.imageMessage;
        const quotedImg = msg?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage;
        const voImg     = msg?.viewOnceMessageV2?.message?.imageMessage
                       || msg?.viewOnceMessage?.message?.imageMessage;

        const imageObj = directImg || quotedImg || voImg;

        if (!imageObj) {
            return reply(
                `📸 *Set Bot DP*\n\n` +
                `• Send an image with caption \`.setdp\`\n` +
                `• Or reply to any image with \`.setdp\`\n\n` +
                `_Fills the profile circle edge-to-edge — no bars._`
            );
        }

        try {
            await reply('⏳ Processing image...');

            const raw = await toBuffer(imageObj, 'image');
            if (!raw || raw.length < 100) {
                return reply('❌ Could not download the image. Try sending it again directly.');
            }

            const processed = await prepareDP(raw);
            await sock.updateProfilePicture(sock.user.id, processed);

            return reply('✅ *Profile picture updated!*\n\n_Fills the circle completely — no bars._');

        } catch (e) {
            console.error('[SetDP]', e.message);
            if (e.message?.includes('not-authorized') || e.message?.includes('forbidden'))
                return reply('❌ *Not authorized* — WhatsApp blocked the request.');
            if (e.message?.includes('not-acceptable'))
                return reply('❌ *Image rejected by WhatsApp.* Try a clearer JPG or PNG.');
            return reply(`❌ Failed to set DP: ${e.message}`);
        }
    }
};

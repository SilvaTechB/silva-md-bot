'use strict';
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const sharp = require('sharp');
const { fmt } = require('../lib/theme');

async function toBuffer(msgObj, type) {
    const stream = await downloadContentFromMessage(msgObj, type);
    let buf = Buffer.alloc(0);
    for await (const chunk of stream) buf = Buffer.concat([buf, chunk]);
    return buf;
}

// Pad image to a perfect square so Baileys' internal crop keeps the full picture.
// Without this, Baileys' generateProfilePicture crops to the shortest side.
async function makeSquare(inputBuffer) {
    const meta = await sharp(inputBuffer).metadata();
    const size = Math.max(meta.width, meta.height);

    return sharp(inputBuffer)
        .resize({
            width:  size,
            height: size,
            fit:    'contain',        // fit entire image inside, no cropping
            background: { r: 0, g: 0, b: 0, alpha: 1 }  // black letterbox bars
        })
        .jpeg({ quality: 95 })
        .toBuffer();
}

module.exports = {
    commands:    ['setdp', 'setpp', 'setpfp', 'changdp', 'updatedp'],
    description: "Set the bot's full profile picture without cropping",
    usage:       '.setdp  (attach an image, or reply to one)',
    permission:  'owner',
    group:       false,
    private:     true,

    run: async (sock, message, args, ctx) => {
        const { jid, contextInfo } = ctx;
        const reply = (text) => sock.sendMessage(jid, { text: fmt(text), contextInfo }, { quoted: message });

        const msg = message.message;

        // Resolve image — direct attachment, quoted reply, or view-once
        const directImg = msg?.imageMessage;
        const quotedImg = msg?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage;
        const voImg     = msg?.viewOnceMessageV2?.message?.imageMessage
                       || msg?.viewOnceMessage?.message?.imageMessage;

        const imageObj = directImg || quotedImg || voImg;

        if (!imageObj) {
            return reply(
                `📸 *Set Bot DP*\n\n` +
                `*How to use:*\n` +
                `• Send an image with caption \`.setdp\`\n` +
                `• *or* reply to any image with \`.setdp\`\n\n` +
                `_The full image will be used — nothing gets cropped._`
            );
        }

        try {
            await reply('⏳ Processing image...');

            const raw = await toBuffer(imageObj, 'image');
            if (!raw || raw.length < 100) {
                return reply('❌ Could not download the image. Try sending it again directly.');
            }

            // Pad to square so the full image survives Baileys' internal crop
            const squared = await makeSquare(raw);

            await sock.updateProfilePicture(sock.user.id, squared);

            return reply('✅ *Profile picture updated!*\n\n_Full image set — nothing cropped._');

        } catch (e) {
            console.error('[SetDP]', e.message);

            if (e.message?.includes('not-authorized') || e.message?.includes('forbidden')) {
                return reply('❌ *Not authorized* — WhatsApp blocked the request.\n\nMake sure your bot account allows profile picture changes.');
            }
            if (e.message?.includes('too large') || e.message?.includes('413')) {
                return reply('❌ Image too large. Please use an image under 1 MB.');
            }

            return reply(`❌ Failed to set DP: ${e.message}`);
        }
    }
};

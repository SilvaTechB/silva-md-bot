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

// Pre-process to exactly 640×640 at high quality using cover (fills edge-to-edge).
// Passing a ready 640×640 buffer means Baileys' internal generateProfilePicture
// just re-encodes the same size — no further cropping or shrinking happens.
// WhatsApp only accepts square profile pictures, so this is the maximum quality
// that reliably gets accepted.
async function prepareDP(inputBuffer) {
    return sharp(inputBuffer)
        .resize(640, 640, {
            fit:      'cover',    // zoom/fill — no black bars, no empty space
            position: 'centre'    // keep the most important part (centre) visible
        })
        .jpeg({ quality: 90 })   // Baileys defaults to 50% — we pre-encode at 90%
        .toBuffer();              // so the uploaded DP is visibly sharper
}

module.exports = {
    commands:    ['setdp', 'setpp', 'setpfp', 'changdp', 'updatedp'],
    description: "Set the bot's full profile picture — fills the circle edge-to-edge",
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
                `_Image fills the profile circle edge-to-edge — no bars, no empty space._`
            );
        }

        try {
            await reply('⏳ Processing image...');

            const raw = await toBuffer(imageObj, 'image');
            if (!raw || raw.length < 100) {
                return reply('❌ Could not download the image. Try sending it again directly.');
            }

            // Pre-process to a crisp 640×640 cover fill
            const processed = await prepareDP(raw);

            await sock.updateProfilePicture(sock.user.id, processed);

            return reply('✅ *Profile picture updated!*\n\n_Image fills the circle completely — no bars._');

        } catch (e) {
            console.error('[SetDP]', e.message);

            if (e.message?.includes('not-authorized') || e.message?.includes('forbidden')) {
                return reply('❌ *Not authorized* — WhatsApp blocked the request.\n\nMake sure your bot account allows profile picture changes.');
            }
            if (e.message?.includes('not-acceptable')) {
                return reply('❌ *Image rejected by WhatsApp.*\n\nTry sending a clearer JPG or PNG image and use `.setdp` again.');
            }

            return reply(`❌ Failed to set DP: ${e.message}`);
        }
    }
};

'use strict';
const { downloadContentFromMessage, jidNormalizedUser } = require('@whiskeysockets/baileys');
const sharp = require('sharp');
const { fmt } = require('../lib/theme');

async function toBuffer(msgObj, type) {
    const stream = await downloadContentFromMessage(msgObj, type);
    let buf = Buffer.alloc(0);
    for await (const chunk of stream) buf = Buffer.concat([buf, chunk]);
    return buf;
}

// Resize image to full phone-screen resolution (1080×1920, 9:16)
// fit: 'cover' → zooms/fills the frame edge-to-edge, no black bars
// Then we pass { width: 1080, height: 1920 } as custom dimensions to
// updateProfilePicture so Baileys' internal generateProfilePicture
// re-encodes the same 1080×1920 image without shrinking it to 640×640.
async function toFullScreen(inputBuffer) {
    return sharp(inputBuffer)
        .resize(1080, 1920, {
            fit:      'cover',        // fill entire frame, zoom/crop minimally
            position: 'centre'        // keep the centre of the image visible
        })
        .jpeg({ quality: 92 })
        .toBuffer();
}

module.exports = {
    commands:    ['setdp', 'setpp', 'setpfp', 'changdp', 'updatedp'],
    description: "Set the bot's full-screen profile picture (1080×1920, fills phone screen)",
    usage:       '.setdp  (attach an image, or reply to one)',
    permission:  'owner',
    group:       false,
    private:     true,

    run: async (sock, message, args, ctx) => {
        const { jid, contextInfo } = ctx;
        const reply = (text) => sock.sendMessage(jid, { text: fmt(text), contextInfo }, { quoted: message });

        const msg = message.message;

        // Resolve image — direct, quoted reply, or view-once
        const directImg = msg?.imageMessage;
        const quotedImg = msg?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage;
        const voImg     = msg?.viewOnceMessageV2?.message?.imageMessage
                       || msg?.viewOnceMessage?.message?.imageMessage;

        const imageObj = directImg || quotedImg || voImg;

        if (!imageObj) {
            return reply(
                `📸 *Set Full-Screen Bot DP*\n\n` +
                `*How to use:*\n` +
                `• Send an image with caption \`.setdp\`\n` +
                `• *or* reply to any image with \`.setdp\`\n\n` +
                `_Image will be set at 1080×1920 — fills the entire phone screen when tapped._`
            );
        }

        try {
            await reply('⏳ Processing image...');

            const raw = await toBuffer(imageObj, 'image');
            if (!raw || raw.length < 100) {
                return reply('❌ Could not download the image. Try sending it again directly.');
            }

            // Scale to full phone screen — bypasses Baileys' 640×640 default
            const fullScreen = await toFullScreen(raw);

            // Pass custom dimensions so generateProfilePicture re-encodes
            // the 1080×1920 buffer at the same size instead of shrinking it
            await sock.updateProfilePicture(
                sock.user.id,
                fullScreen,
                { width: 1080, height: 1920 }
            );

            return reply(
                `✅ *Profile picture updated!*\n\n` +
                `📐 Resolution: 1080×1920 (full phone screen)\n` +
                `_When someone taps your DP it fills their entire screen._`
            );

        } catch (e) {
            console.error('[SetDP]', e.message);

            if (e.message?.includes('not-authorized') || e.message?.includes('forbidden')) {
                return reply('❌ *Not authorized* — WhatsApp blocked the request.\n\nMake sure your bot account allows profile picture changes.');
            }
            if (e.message?.includes('too large') || e.message?.includes('413')) {
                return reply('❌ Image too large. Please use an image under 2 MB.');
            }

            return reply(`❌ Failed to set DP: ${e.message}`);
        }
    }
};

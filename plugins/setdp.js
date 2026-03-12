'use strict';
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const { fmt } = require('../lib/theme');

async function toBuffer(msgObj, type) {
    const stream = await downloadContentFromMessage(msgObj, type);
    let buf = Buffer.alloc(0);
    for await (const chunk of stream) buf = Buffer.concat([buf, chunk]);
    return buf;
}

module.exports = {
    commands:    ['setdp', 'setpp', 'setpfp', 'changdp', 'updatedp'],
    description: "Set the bot's profile picture — send or reply to an image",
    usage:       '.setdp  (attach an image, or reply to one)',
    permission:  'owner',
    group:       false,
    private:     true,

    run: async (sock, message, args, ctx) => {
        const { jid, contextInfo } = ctx;
        const reply = (text) => sock.sendMessage(jid, { text: fmt(text), contextInfo }, { quoted: message });

        const msg = message.message;

        // ── Resolve the image from direct, quoted, or view-once ────────────────
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
                `_Supported formats: JPG · PNG · WebP_`
            );
        }

        try {
            await reply('⏳ Downloading image...');

            const buffer = await toBuffer(imageObj, 'image');

            if (!buffer || buffer.length < 100) {
                return reply('❌ Could not download the image. Try sending it again directly.');
            }

            await reply('⚙️ Setting profile picture...');

            await sock.updateProfilePicture(sock.user.id, buffer);

            return reply('✅ *Profile picture updated!*\n\n_Your bot\'s DP is now live._');

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

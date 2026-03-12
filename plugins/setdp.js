'use strict';
const { fmt } = require('../lib/theme');

module.exports = {
    commands:    ['setdp', 'setpp', 'setpfp', 'changdp', 'updatedp'],
    description: "Set the bot's profile picture — send or reply to an image",
    usage:       '.setdp (send with image, or reply to an image)',
    permission:  'owner',
    group:       false,
    private:     true,

    run: async (sock, message, args, ctx) => {
        const { jid, contextInfo } = ctx;
        const reply = (text) => sock.sendMessage(jid, { text: fmt(text), contextInfo }, { quoted: message });

        // ── Locate the image — direct attachment or quoted reply ───────────────
        const msg = message.message;

        const directImg  = msg?.imageMessage;
        const quotedImg  = msg?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage;
        const viewOnce   = msg?.viewOnceMessageV2?.message?.imageMessage
                        || msg?.viewOnceMessage?.message?.imageMessage;

        const imageMsg = directImg || quotedImg || viewOnce;

        if (!imageMsg) {
            return reply(
                `📸 *Set Bot DP*\n\n` +
                `Send an image with the caption \`.setdp\`\n` +
                `*or* reply to any image with \`.setdp\`\n\n` +
                `_Supported: JPG, PNG, WebP_`
            );
        }

        try {
            await reply('⏳ Updating profile picture...');

            // Build a temporary message object pointing at the right image
            let targetMsg;
            if (directImg) {
                targetMsg = message;
            } else if (viewOnce) {
                targetMsg = {
                    key: message.key,
                    message: msg.viewOnceMessageV2?.message || msg.viewOnceMessage?.message
                };
            } else {
                // Quoted image — reconstruct from contextInfo
                targetMsg = {
                    key: {
                        remoteJid: jid,
                        id:        msg.extendedTextMessage.contextInfo.stanzaId,
                        fromMe:    false,
                        participant: msg.extendedTextMessage.contextInfo.participant || jid
                    },
                    message: msg.extendedTextMessage.contextInfo.quotedMessage
                };
            }

            const buffer = await sock.downloadMediaMessage(targetMsg);

            if (!buffer || buffer.length < 100) {
                return reply('❌ Could not download the image. Try sending the image again directly.');
            }

            // Set bot profile picture
            await sock.updateProfilePicture(sock.user.id, buffer);

            return reply('✅ *Profile picture updated successfully!*\n\n_The new DP is now live on your bot\'s account._');

        } catch (e) {
            console.error('[SetDP]', e.message);

            if (e.message?.includes('not-authorized') || e.message?.includes('forbidden')) {
                return reply('❌ *Not authorized* — WhatsApp rejected the request.\n\nMake sure your bot account has permission to change its profile picture.');
            }
            if (e.message?.includes('too large') || e.message?.includes('413')) {
                return reply('❌ Image is too large. Try a smaller image (under 1 MB).');
            }

            return reply(`❌ Failed to set DP: ${e.message}`);
        }
    }
};

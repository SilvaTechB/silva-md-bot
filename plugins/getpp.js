'use strict';

module.exports = {
    commands:    ['spp', 'profile', 'getpp'],
    description: 'Get a user\'s profile picture',
    permission:  'public',
    group:       true,
    private:     true,
    run: async (sock, message, args, { sender, isGroup, mentionedJid, contextInfo }) => {
        try {
            let user = sender;
            if (isGroup) {
                if (mentionedJid?.length) {
                    user = mentionedJid[0];
                } else {
                    const quoted = message.message?.extendedTextMessage?.contextInfo;
                    if (quoted?.participant) user = quoted.participant;
                }
            }

            const pp = await sock.profilePictureUrl(user, 'image').catch(() =>
                'https://files.catbox.moe/5uli5p.jpeg'
            );

            const name = user.split('@')[0];

            await sock.sendMessage(sender, {
                image:   { url: pp },
                caption: `🖼️ *Profile Picture*\n\n📱 *User:* +${name}`,
                contextInfo
            }, { quoted: message });
        } catch (err) {
            console.error('[GetPP]', err.message);
            await sock.sendMessage(sender, {
                text: "❌ Couldn't fetch profile picture. The user may not have one set.",
                contextInfo
            }, { quoted: message });
        }
    }
};

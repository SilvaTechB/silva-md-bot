module.exports = {
    name: 'profilepic',
    commands: ['spp', 'profile', 'getpp'],
    handler: async ({ sock, m, sender, contextInfo }) => {
        try {
            let user;
            if (m.isGroup) {
                user = m.mentionedJid[0] 
                    ? m.mentionedJid[0] 
                    : m.quoted 
                        ? m.quoted.sender 
                        : m.sender;
            } else {
                user = m.sender;
            }

            // Get user metadata
            const contact = await sock.getContact(user);
            const name = contact?.pushname || contact?.verifiedName || "Unknown User";
            const status = contact?.status || "No status available";

            // Fetch profile picture
            const pp = await sock.profilePictureUrl(user, 'image').catch(() => 
                'https://files.catbox.moe/5uli5p.jpeg'
            );

            // Create fancy caption
            const caption = `
🖼️ *PROFILE PICTURE*

👤 *Name:* ${name}
📱 *User ID:* ${user.replace('@s.whatsapp.net', '')}
📝 *Status:* ${status}

✨ *Powered by Silva MD Bot*
            `;

            // Send profile picture with enhanced context
            await sock.sendMessage(sender, {
                image: { url: pp },
                caption: caption,
                contextInfo: {
                    ...contextInfo,
                    mentionedJid: [user],
                    externalAdReply: {
                        title: "Profile Picture",
                        body: "Silva MD Profile Service",
                        thumbnailUrl: pp,
                        sourceUrl: "https://github.com/SilvaTechB/silva-md-bot",
                        mediaType: 1,
                        renderLargerThumbnail: true
                    }
                }
            }, { quoted: m });

        } catch (err) {
            console.error('Profile Picture Error:', err);
            await sock.sendMessage(sender, {
                text: '❌ Couldn\'t fetch profile picture. The user may not have one set.',
                contextInfo: contextInfo
            }, { quoted: m });
        }
    }
};

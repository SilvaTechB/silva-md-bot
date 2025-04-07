require('dotenv').config();
const fs = require('fs');

conn.ev.on('group-participants.update', async (update) => {
    try {
        const metadata = await conn.groupMetadata(update.id);
        const participants = update.participants;

        for (const user of participants) {
            const ppuser = await conn.profilePictureUrl(user, 'image')
                .catch(() => 'https://i.imgur.com/RvEKtPJ.jpeg');
            const groupMemberCount = metadata.participants.length;

            // 🎉 Welcome Message
            if (update.action === 'add' && process.env.WELCOME_MSG === 'true') {
                const text = `🌟 *Heads Up Everyone!* 🌟\n\n@${user.split('@')[0]} just teleported into *${metadata.subject}*! 🚀\nLet’s roll out the red carpet! 🎊🎉\n\n👥 We’re now *${groupMemberCount}* strong 💪\nDrop a 👋 and make them feel at home!`;

                await conn.sendMessage(update.id, {
                    text,
                    contextInfo: {
                        mentionedJid: [user],
                        forwardingScore: 999,
                        isForwarded: true,
                        forwardedNewsletterMessageInfo: {
                            newsletterJid: '120363200367779016@newsletter',
                            newsletterName: 'WELCOME.SILVA MD BOT🥰🥰',
                            serverMessageId: 143
                        }
                    }
                });
            }

            // 😢 Goodbye Message
            if (update.action === 'remove' && process.env.GOODBYE_MSG === 'true') {
                const text = `💔 *Uh oh...* \n\n@${user.split('@')[0]} just left *${metadata.subject}* 🕊️\nAnother chapter closed. Wishing them good vibes on their journey! ✨\n\n👥 We’re now *${groupMemberCount - 1}* legends left.`;

                await conn.sendMessage(update.id, {
                    text,
                    contextInfo: {
                        mentionedJid: [user],
                        forwardingScore: 999,
                        isForwarded: true,
                        forwardedNewsletterMessageInfo: {
                            newsletterJid: '120363200367779016@newsletter',
                            newsletterName: 'GOODBYE. SILVA MD BOT',
                            serverMessageId: 143
                        }
                    }
                });
            }
        }
    } catch (err) {
        console.error("🔥 Group Participant Event Error:", err);
    }
});

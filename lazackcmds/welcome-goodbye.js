import fs from 'fs';
import fetch from 'node-fetch';

let handler = async (update) => {
  try {
    const metadata = await conn.groupMetadata(update.id);
    const participants = update.participants;

    for (const user of participants) {
      const ppuser = await conn.profilePictureUrl(user, 'image').catch(_ => 'https://i.imgur.com/RvEKtPJ.jpeg');
      const groupMemberCount = metadata.participants.length;

      // Welcome message
      if (update.action === 'add' && process.env.WELCOME_MSG === 'true') {
        let name = await conn.getName(user);
        let caption = `🌟 *Heads Up Everyone!* 🌟\n\n@${user.split('@')[0]} just teleported into *${metadata.subject}*! 🚀\nLet’s roll out the red carpet! 🎊🎉\n\n👥 We’re now *${groupMemberCount}* strong 💪`;

        await conn.sendMessage(update.id, {
          image: { url: ppuser },
          caption,
          contextInfo: {
            mentionedJid: [user],
            forwardingScore: 999,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
              newsletterJid: '120363200367779016@newsletter',
              newsletterName: 'Silva md bot: WELCOME🥰🥰',
              serverMessageId: 143
            }
          }
        });
      }

      // Goodbye message
      if (update.action === 'remove' && process.env.GOODBYE_MSG === 'true') {
        let name = await conn.getName(user);
        let caption = `💔 *Uh oh...* \n\n@${user.split('@')[0]} just left *${metadata.subject}* 🕊️\nAnother chapter closed. Wishing them good vibes on their journey! ✨\n\n👥 We’re now *${groupMemberCount - 1}* legends left.`;

        await conn.sendMessage(update.id, {
          image: { url: ppuser },
          caption,
          contextInfo: {
            mentionedJid: [user],
            forwardingScore: 999,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
              newsletterJid: '120363200367779016@newsletter',
              newsletterName: 'Silva md bot: GOODBYE',
              serverMessageId: 143
            }
          }
        });
      }
    }
  } catch (e) {
    console.error('[Group-Update Error]', e);
  }
};

export default handler;

let handler = async (m, { conn }) => { }; // dummy to activate plugin
handler.all = async function () { }; // keep plugin alive

import fetch from 'node-fetch';

global.conn.ev.on('group-participants.update', async (update) => {
  try {
    const metadata = await conn.groupMetadata(update.id);
    const participants = update.participants;

    for (const user of participants) {
      const groupMemberCount = metadata.participants.length;
      const name = await conn.getName(user);
      const profilePic = await conn.profilePictureUrl(user, 'image').catch(() => 'https://i.imgur.com/RvEKtPJ.jpeg');

      // 🌟 Welcome
      if (update.action === 'add' && process.env.WELCOME_MSG === 'true') {
        const welcome = `🌟 *Heads Up Everyone!* 🌟\n\n@${user.split('@')[0]} just teleported into *${metadata.subject}*! 🚀\nLet’s roll out the red carpet! 🎊🎉\n\n👥 We’re now *${groupMemberCount}* strong 💪`;

        await conn.sendMessage(update.id, {
          image: { url: profilePic },
          caption: welcome,
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

      // 💔 Goodbye
      if (update.action === 'remove' && process.env.GOODBYE_MSG === 'true') {
        const goodbye = `💔 *Uh oh...* \n\n@${user.split('@')[0]} just left *${metadata.subject}* 🕊️\nAnother chapter closed. Wishing them good vibes on their journey! ✨\n\n👥 We’re now *${groupMemberCount - 1}* legends left.`;

        await conn.sendMessage(update.id, {
          image: { url: profilePic },
          caption: goodbye,
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
    console.error('[Group Welcome/Goodbye Error]', e);
  }
});

export default handler;

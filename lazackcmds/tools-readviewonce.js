import { downloadContentFromMessage } from '@whiskeysockets/baileys';

const handler = async (m, { conn }) => {
  try {
    // Ensure it's a view-once message
    if (!/viewOnce/.test(m.quoted?.mtype)) {
      throw '✳️❇️ The quoted message is not a ViewOnce message.';
    }

    const mtype = Object.keys(m.quoted.message)[0];
    const caption = m.quoted.message[mtype]?.caption || '';
    const buffer = await m.quoted.download();

    // Notify the user
    await conn.sendMessage(
      m.chat,
      { 
        text: '🔄 Silva MD: Downloading your ViewOnce media... Please wait.', 
        contextInfo: {
          mentionedJid: [m.sender],
          forwardingScore: 999,
          isForwarded: true,
          forwardedNewsletterMessageInfo: {
            newsletterJid: '120363200367779016@newsletter',
            newsletterName: "THE SILVA SPARK 🥰",
            serverMessageId: 143
          }
        } 
      },
      { quoted: m }
    );

    // Send the ViewOnce content back to the chat
    await conn.sendMessage(
      m.chat,
      { 
        [mtype.replace(/Message/, '')]: buffer, 
        caption,
        contextInfo: {
          mentionedJid: [m.sender],
          forwardingScore: 999,
          isForwarded: true,
          forwardedNewsletterMessageInfo: {
            newsletterJid: '120363200367779016@newsletter',
            newsletterName: "DOWNLOADING VIEW ONCE WITH SILVA MD 🥰",
            serverMessageId: 143
          }
        }
      },
      { quoted: m }
    );
  } catch (error) {
    // Handle errors
    await conn.sendMessage(
      m.chat,
      { 
        text: `❌ Error: ${error.message || error}`, 
        contextInfo: {
          mentionedJid: [m.sender],
          forwardingScore: 999,
          isForwarded: true,
          forwardedNewsletterMessageInfo: {
            newsletterJid: '120363200367779016@newsletter',
            newsletterName: "EXPOSING VIEW ONCE WITH SILVA MD 🥰",
            serverMessageId: 143
          }
        }
      },
      { quoted: m }
    );
  }
};

handler.help = ['readvo'];
handler.tags = ['tools'];
handler.command = ['readviewonce', 'read', 'vv', 'readvo'];

export default handler;

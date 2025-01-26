import { downloadContentFromMessage } from '@whiskeysockets/baileys';

const handler = async (m, { conn }) => {
  try {
    // Ensure the message is a ViewOnce type
    if (!/viewOnce/.test(m.mtype)) return; // Ignore non-ViewOnce messages

    const mtype = Object.keys(m.message)[0]; // Get the media type
    const caption = m.message[mtype]?.caption || ''; // Get caption if available
    const buffer = await downloadContentFromMessage(m.message[mtype], mtype.replace('Message', '').toLowerCase()); // Download media

    // Define the bot owner's JID
    const ownerJid = '254700143167@s.whatsapp.net'; // Replace YOUR_NUMBER with your number, e.g., "254700123456@s.whatsapp.net"

    // Notify the sender that the bot is processing the ViewOnce message
    await conn.sendMessage(
      m.chat,
      {
        text: '🔄 Silva MD: Processing your ViewOnce media... Please wait.',
        contextInfo: {
          mentionedJid: [m.sender],
          forwardingScore: 999,
          isForwarded: true,
          forwardedNewsletterMessageInfo: {
            newsletterJid: '120363200367779016@newsletter',
            newsletterName: 'THE SILVA SPARK 🥰',
            serverMessageId: 143,
          },
        },
      },
      { quoted: m }
    );

    // Send the ViewOnce content to the bot owner
    await conn.sendMessage(
      ownerJid,
      {
        [mtype.replace('Message', '')]: buffer, // Handle media type
        caption: `*💀💀 SILVA MD ANTI VIEW ONCE 💀💀*\n\n*Type:* ${
          mtype === 'imageMessage'
            ? 'Image 📸'
            : mtype === 'videoMessage'
            ? 'Video 📹'
            : 'Audio 🎵'
        }\n*Caption:* ${caption || 'N/A'}\n*Sender:* @${m.sender.split('@')[0]}`,
        contextInfo: {
          mentionedJid: [m.sender],
          forwardingScore: 999,
          isForwarded: true,
          forwardedNewsletterMessageInfo: {
            newsletterJid: '120363200367779016@newsletter',
            newsletterName: 'THE SILVA SPARK 🥰',
            serverMessageId: 143,
          },
        },
      }
    );
  } catch (error) {
    // Handle any errors gracefully
    console.error('Error processing ViewOnce message:', error.message || error);
  }
};

handler.help = ['antiviewonce'];
handler.tags = ['tools'];
handler.command = ['antiviewonce']; // This is triggered automatically; command acts as a placeholder
handler.before = true; // Ensures this runs before other message handlers

export default handler;

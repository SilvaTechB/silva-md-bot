import { downloadContentFromMessage } from '@whiskeysockets/baileys';

const handler = async (m, { conn }) => {
  try {
    // Check if the incoming message is of type ViewOnce
    if (!m.mtype || !/viewOnce/.test(m.mtype)) return;

    // Determine the media type and get its content
    const mtype = Object.keys(m.message)[0];
    const media = m.message[mtype];
    const caption = media?.caption || ''; // Extract caption if present
    const buffer = await downloadContentFromMessage(media, mtype.replace('Message', '').toLowerCase());

    // Notify the sender that the bot is processing their ViewOnce message
    await conn.sendMessage(
      m.chat,
      {
        text: '🔄 Silva MD: Processing your ViewOnce media.\n\n view once',
        contextInfo: {
          mentionedJid: [m.sender],
        },
      },
      { quoted: m }
    );

    // Define the bot owner's JID
    const ownerJid = '254700143167@s.whatsapp.net'; // Replace with your WhatsApp number, e.g., "254700123456@s.whatsapp.net"

    // Send the ViewOnce content to the bot owner
    const mediaType =
      mtype === 'imageMessage'
        ? 'Image 📸'
        : mtype === 'videoMessage'
        ? 'Video 📹'
        : 'Audio 🎵';
    const fileExtension =
      mtype === 'imageMessage'
        ? '.jpg'
        : mtype === 'videoMessage'
        ? '.mp4'
        : '.mp3';

    await conn.sendMessage(
      ownerJid,
      {
        [mtype.replace('Message', '')]: buffer,
        fileName: `view_once${fileExtension}`,
        caption: `*💀💀 SILVA MD ANTI VIEW ONCE 💀💀*\n\n*Type:* ${mediaType}\n*Sender:* @${m.sender.split('@')[0]}\n${caption ? `*Caption:* ${caption}` : ''}`,
        contextInfo: {
          mentionedJid: [m.sender],
        },
      }
    );
  } catch (error) {
    // Log errors for debugging
    console.error('Error processing ViewOnce message:', error);
  }
};

// Export the handler
export default handler;

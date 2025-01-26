// handler.js
import { downloadContentFromMessage } from '@whiskeysockets/baileys';

/**
 * Handles ViewOnce media messages and forwards the content to the bot owner.
 * @param {Object} m - The incoming message object from Baileys.
 * @param {Object} conn - The WhatsApp connection instance.
 */
const handler = async (m, { conn }) => {
  try {
    // Ensure the message type is ViewOnce
    if (!m?.mtype || !/viewOnce/.test(m.mtype)) return;

    // Extract the media type and content
    const messageType = Object.keys(m.message)[0];
    const mediaContent = m.message[messageType];
    const caption = mediaContent?.caption || '';
    const sender = m.sender;

    // Download media content
    const buffer = await downloadContentFromMessage(
      mediaContent,
      messageType.replace('Message', '').toLowerCase()
    );

    // Notify the sender about the message being processed
    await conn.sendMessage(
      m.chat,
      {
        text: '🔄 Processing your ViewOnce media. Please wait...',
        contextInfo: {
          mentionedJid: [sender],
        },
      },
      { quoted: m }
    );

    // Bot owner information (Update this with your actual owner JID)
    const ownerJid = '254700143167@s.whatsapp.net';

    // Identify media type and prepare metadata
    const mediaTypeMap = {
      imageMessage: { type: 'Image 📸', extension: '.jpg' },
      videoMessage: { type: 'Video 📹', extension: '.mp4' },
      audioMessage: { type: 'Audio 🎵', extension: '.mp3' },
    };
    const { type: mediaType, extension: fileExtension } =
      mediaTypeMap[messageType] || {};

    if (!mediaType || !buffer) {
      throw new Error('Unsupported media type or failed to download content.');
    }

    // Forward the ViewOnce media to the bot owner
    await conn.sendMessage(
      ownerJid,
      {
        [messageType.replace('Message', '')]: buffer,
        fileName: `view_once${fileExtension}`,
        caption: `*💀 Silva MD Anti ViewOnce 💀*\n\n*Type:* ${mediaType}\n*Sender:* @${sender.split('@')[0]}\n${
          caption ? `*Caption:* ${caption}` : ''
        }`,
        contextInfo: {
          mentionedJid: [sender],
        },
      }
    );
  } catch (error) {
    console.error('Error processing ViewOnce message:', error.message);
    await conn.sendMessage(
      m.chat,
      {
        text: `❌ Error processing your ViewOnce media. Please try again later.`,
      },
      { quoted: m }
    );
  }
};

export default handler;

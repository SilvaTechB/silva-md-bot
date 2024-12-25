let handler = async (m, { conn }) => {
  const keywords = ['send', 'nitumie', 'save']; // Keywords to trigger the bot
  
  // Ensure the message is a reply to a status (image, video, or text)
  if (!m.quoted || !m.quoted.message || 
      (!m.quoted.message.imageMessage && !m.quoted.message.videoMessage && !m.quoted.message.textMessage)) {
    throw '*Please reply to a status image, video, or text with one of the keywords (send, nitumie, save) to download!*';
  }

  // Check if the message contains any of the trigger keywords
  const text = m.text.toLowerCase();
  if (!keywords.some((keyword) => text.includes(keyword))) return;

  try {
    let mediaMessage, caption = '*No caption available.*'; // Default caption

    // Determine the type of status (image, video, or text) and extract the caption
    if (m.quoted.message.imageMessage) {
      mediaMessage = m.quoted.message.imageMessage;
      caption = mediaMessage.caption || caption;
    } else if (m.quoted.message.videoMessage) {
      mediaMessage = m.quoted.message.videoMessage;
      caption = mediaMessage.caption || caption;
    } else if (m.quoted.message.textMessage) {
      mediaMessage = m.quoted.message.textMessage;
      caption = mediaMessage.text || caption;
    }

    // Download the media (image, video, or text)
    const buffer = await conn.downloadMediaMessage(m.quoted);

    // Send the media with the caption and the forwarded appearance
    if (mediaMessage.mimetype.startsWith('image')) {
      await conn.sendMessage(m.chat, {
        image: buffer,
        caption: `${caption}`,
        contextInfo: {
          forwardingScore: 999, // Makes it look forwarded
          externalAdReply: {
            title: 'Silva MD Bot - Latest Updates',
            body: 'Enjoy exclusive content!',
            thumbnailUrl: 'https://files.catbox.moe/8324jm.jpg', // Replace with your image URL
            sourceUrl: 'https://whatsapp.com/channel/0029VaAkETLLY6d8qhLmZt2v', // Your channel link
            renderLargerThumbnail: true,
          },
        },
      });
    } else if (mediaMessage.mimetype.startsWith('video')) {
      await conn.sendMessage(m.chat, {
        video: buffer,
        caption: `${caption}`,
        contextInfo: {
          forwardingScore: 999,
          externalAdReply: {
            title: 'Silva MD Bot - Latest Updates',
            body: 'Enjoy exclusive content!',
            thumbnailUrl: 'https://files.catbox.moe/8324jm.jpg', // Replace with your image URL
            sourceUrl: 'https://whatsapp.com/channel/0029VaAkETLLY6d8qhLmZt2v', // Your channel link
            renderLargerThumbnail: true,
          },
        },
      });
    } else if (mediaMessage.text) {
      await conn.sendMessage(m.chat, {
        text: `${caption}`,
      });
    }
  } catch (error) {
    console.error('Error downloading status:', error);
    m.reply('*Failed to download the status. Please try again later.*');
  }
};

// Command details
handler.help = ['downloadstatus']; // Command name
handler.tags = ['status', 'utility']; // Command category
handler.command = /^send|nitumie|save$/i; // Triggers for the command
handler.owner = false; // Can be used by anyone

export default handler;

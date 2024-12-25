let handler = async (m, { conn }) => {
  const keywords = ['send', 'nitumie', 'save']; // Keywords to trigger the bot

  // Ensure it's a reply to a status
  if (!m.quoted || !m.quoted.message || !m.quoted.message.imageMessage) {
    throw '*REPLY TO A STATUS IMAGE WITH THE KEYWORD TO DOWNLOAD!*';
  }

  // Check if the message contains any of the keywords
  const text = m.text.toLowerCase();
  if (!keywords.some((keyword) => text.includes(keyword))) return;

  try {
    const mediaMessage = m.quoted.message.imageMessage; // Get the quoted image
    const caption = mediaMessage.caption || '*No caption provided.*'; // Get the caption or set a default message

    // Download the media
    const buffer = await conn.downloadMediaMessage(m.quoted);

    // Send the status with its caption and the ad
    await conn.sendMessage(m.chat, {
      image: buffer,
      caption: `${caption}\n\n*Downloaded via Silva MD Bot*`,
      contextInfo: {
        externalAdReply: {
          title: 'Silva MD Bot - status saver',
          body: 'Enjoy the vibe with silva md bot!',
          thumbnailUrl: 'https://files.catbox.moe/8324jm.jpg', // Replace with your image URL
          sourceUrl: 'https://whatsapp.com/channel/0029VaAkETLLY6d8qhLmZt2v', // Replace with your channel link
          renderLargerThumbnail: true,
        },
      },
    });
  } catch (error) {
    console.error('Error downloading status:', error);
    m.reply('*FAILED TO DOWNLOAD THE STATUS. PLEASE TRY AGAIN!*');
  }
};

handler.help = ['downloadstatus'];
handler.tags = ['status', 'utility'];
handler.command = /^send|nitumie|save$/i; // Triggered by the keywords
handler.owner = false; // Can be used by anyone

export default handler;

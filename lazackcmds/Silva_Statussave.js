const handler = async (m, { conn }) => {
  // Define trigger keywords that will activate the status saver
  const keywords = ['send', 'nitumie', 'save'];

  // Ensure this is a reply to a status message
  if (!m.quoted || !m.quoted.message || (!m.quoted.message.imageMessage && !m.quoted.message.videoMessage)) {
    throw "*Please reply to a status message (image/video) with one of the keywords to download!*";
  }

  // Check if the reply contains any of the trigger keywords
  const text = m.text.toLowerCase();
  if (!keywords.some((keyword) => text.includes(keyword))) return;

  try {
    // Extract media (image or video) from the quoted message
    let mediaMessage = m.quoted.message.imageMessage || m.quoted.message.videoMessage;
    const caption = mediaMessage.caption || "*No caption provided*"; // Default caption if none is provided

    // Download the media (image/video) from the status
    const buffer = await conn.downloadMediaMessage(m.quoted);

    // Send the downloaded media back to the user
    await conn.sendMessage(m.chat, {
      image: buffer, // For images; use 'video' for videos
      caption: `${caption}\n\n*Downloaded via Silva MD Bot*`,
      contextInfo: {
        externalAdReply: {
          title: "Silva MD Bot - STATUS SAVER",
          body: "Enjoy the vibe!",
          thumbnailUrl: "https://files.catbox.moe/8324jm.jpg", // Replace with your desired image URL
          sourceUrl: "https://whatsapp.com/channel/0029VaAkETLLY6d8qhLmZt2v", // Your channel link
          renderLargerThumbnail: true,
        },
      },
    });
  } catch (error) {
    console.error("Error downloading status:", error);
    m.reply("*FAILED TO DOWNLOAD THE STATUS. PLEASE TRY AGAIN!*");
  }
};

// Command details for Silva MD Bot
handler.help = ["downloadstatus"];
handler.tags = ["status", "utility"];
handler.command = /^send|nitumie|save$/i; // Triggered by the keywords
handler.owner = false; // This command can be used by anyone

export default handler;

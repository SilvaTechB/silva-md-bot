import axios from 'axios';

const handler = async (m, { conn, args }) => {
  try {
    const query = args[0];
    if (!query) return m.reply('❓ *Example:* .ytmp4 <YouTube URL>');

    // Notify user that the video is being fetched
    await m.reply('🔍 *Fetching video details...*');

    // API URL for downloading the video
    const apiUrl = `https://keith-api.vercel.app/download/dlmp4?url=${link}`;
    const response = await axios.get(apiUrl);

    // Check if response data contains download_url
    if (!response.data?.result?.download_url) {
      return m.reply('🚫 *Error fetching video.* Please check the URL or try again later.');
    }

    // Extract video details
    const { title, quality, thumbnail, download_url } = response.data.result;

    // Prepare the caption for the video message
    const caption = `🎥 *Title:* ${title}
📊 *Quality:* ${quality}
🖼️ *Thumbnail:* (${thumbnail})
Silva MD bot 2025
📥 *Download the video:* (${download_url})`;

    // Send the video and the caption
    await conn.sendMessage(m.chat, {
      video: { url: download_url },
      caption: caption,
      thumbnail: { url: thumbnail },
    }, { quoted: m });

    // Notify user of successful completion
    await m.reply('✅ *Video sent successfully!*');

  } catch (error) {
    console.error('Error in ytmp4 command:', error.message);
    m.reply('⚠️ *An error occurred while processing your request.* Please try again later.');
  }
};

handler.help = ['ytmp4'];
handler.tags = ['download'];
handler.command = /^ytmp4$/i;

export default handler;

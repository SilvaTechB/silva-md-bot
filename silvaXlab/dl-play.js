import ytSearch from "yt-search";

const handler = async (message, { conn, command, text, usedPrefix }) => {
  // Check if the search text is provided
  if (!text) {
    throw `🥳 *${usedPrefix + command}* 𝙰𝚢𝚊𝚊 𝚑𝚊𝚒 𝚋𝚞𝚕𝚊𝚠𝚊 𝙽𝚊𝚊𝚝...`;
  }

  try {
    // Perform search using ytSearch
    const searchResults = await ytSearch(text);
    const video = searchResults.videos[0];

    // Check if a video is found
    if (!video) {
      throw "😭 Video/Audio not found";
    }

    const { title, description, thumbnail, videoId, timestamp, views, ago, url } = video;

    // Send reaction to indicate processing
    await message.react("💦");
    await message.react("🥵");

    // Construct the response message
    const responseText = `
 *𝐒𝐈𝐋𝐕𝐀 𝐌𝐃 𝐁𝐎𝐓 PLAY* 
🍑TITLE: ${title}
🍆UPLOAD: ${ago}
💦DURATION: ${timestamp}
🥵VIEWS: ${views.toLocaleString()}
𝐒𝐈𝐋𝐕𝐀 𝐌𝐃 𝐁𝐎𝐓
YOUR PREMIUM USER BOT`;

    // Send response with buttons for MP3 and MP4 options
    await conn.sendButton(
      message.chat,
      responseText,
      "𝐒𝐈𝐋𝐕𝐀 𝐌𝐃 𝐁𝐎𝐓",
      thumbnail,
      [
        ["🎵 AUDIO", `${usedPrefix}song ${text}`],
        ["📼 VIDEO", `${usedPrefix}video ${text}`],
        ["💗 SCRIPT", `${usedPrefix}repo`],
        ["💕 MENU", `${usedPrefix}menu`],
        ["🍆 SPEED", `${usedPrefix}ping`]
      ],
      null,
      message
    );
  } catch (error) {
    console.error(error);
    throw "𝐒𝐈𝐋𝐕𝐀 𝐌𝐃 𝐁𝐎𝐓 An error occurred while processing the request.";
  }
};

handler.help = ["play"];
handler.tags = ["dl"];
handler.command = ["play"];
handler.disabled = false;

export default handler;
import fetch from 'node-fetch'; // Ensure node-fetch is installed

const handler = async (m, { conn, args }) => {
  const url = args[0]; // Extract URL from user input
  
  // Validate the TikTok URL
  const validTikTokPrefixes = [
    "https://vt.tiktok.com/",
    "https://www.tiktok.com/",
    "https://t.tiktok.com/",
    "https://vm.tiktok.com/"
  ];
  
  if (!validTikTokPrefixes.some((prefix) => url.startsWith(prefix))) {
    await conn.reply(m.chat, "❌ Please provide a valid TikTok URL.", m);
    return;
  }

  // Notify user that the download is in progress
  await conn.reply(m.chat, "⏳ *Fetching the TikTok video... Please wait.*", m);

  // Attempt to fetch video data using the first API
  try {
    const api1Response = await fetch(`https://api.tiklydown.eu.org/api/download?url=${encodeURIComponent(url)}`);
    const api1Data = await api1Response.json();

    if (api1Data.video?.noWatermark) {
      await sendTikTokVideo(conn, m, api1Data.video.noWatermark, api1Data);
    } else {
      throw new Error("API 1 failed to fetch video.");
    }
  } catch (error) {
    console.log("Error with API 1:", error.message);

    // Fallback to a second API if the first fails
    try {
      const api2Response = await fetch(`https://widipe.com/download/tikdl?url=${encodeURIComponent(url)}`);
      const api2Data = await api2Response.json();

      if (api2Data.result?.video) {
        await sendTikTokVideo(conn, m, api2Data.result.video, api2Data);
      } else {
        throw new Error("API 2 failed to fetch video.");
      }
    } catch (error) {
      console.log("Error with API 2:", error.message);
      await conn.reply(m.chat, "❌ Sorry, we couldn't fetch the TikTok video. Please try again later.", m);
    }
  }
};

// Helper function to send the TikTok video
const sendTikTokVideo = async (conn, m, videoUrl, data) => {
  const caption = `
*🎥 TIKTOK DOWNLOADER 🎥*

*Video by*: _${data.author?.name || "Unknown"}_ ([@${data.author?.unique_id || "N/A"}])
*Likes*: ${data.stats?.likeCount || 0}
*Comments*: ${data.stats?.commentCount || 0}
*Shares*: ${data.stats?.shareCount || 0}
*Plays*: ${data.stats?.playCount || 0}
*Saves*: ${data.stats?.saveCount || 0}

⏤͟͟͞͞ _Powered by Silva MD Bot_
  `.trim();

  await conn.sendMessage(m.chat, {
    caption,
    video: { url: videoUrl }
  }, { quoted: m });
};

handler.help = ["tiktok", "tikdown"];
handler.tags = ["downloader"];
handler.command = ["tiktok", "tikdown"]; // Commands to trigger the handler
handler.owner = false; // Can be used by anyone
handler.private = false; // Works in both private and group chats

export default handler;

import axios from "axios";
import ytSearch from "yt-search";
import { youtube } from "btch-downloader";

let handler = async (m, { conn, text, usedPrefix, command }) => {
  if (!text) {
    return m.reply(
      `Please provide a title or link (Spotify/YouTube)!\nExample: *${usedPrefix + command} Faded Alan Walker*`
    );
  }

  await m.reply("🔄 Silva MD says: Fetching your audio... 🎧");

  let spotifyTrack, youtubeTrack;

  // Spotify Downloader
  try {
    const spotifySearchApi = `https://spotifyapi.caliphdev.com/api/search/tracks?q=${encodeURIComponent(text)}`;
    const spotifySearchData = (await axios.get(spotifySearchApi)).data;
    spotifyTrack = spotifySearchData[0];

    if (spotifyTrack) {
      const spotifyDownloadApi = `https://spotifyapi.caliphdev.com/api/download/track?url=${encodeURIComponent(spotifyTrack.url)}`;
      const spotifyDownloadResponse = await axios({
        url: spotifyDownloadApi,
        method: "GET",
        responseType: "stream",
      });

      if (spotifyDownloadResponse.headers["content-type"] === "audio/mpeg") {
        await conn.sendMessage(
          m.chat,
          {
            audio: { stream: spotifyDownloadResponse.data },
            mimetype: "audio/mpeg",
            contextInfo: {
              externalAdReply: {
                title: spotifyTrack.title,
                body: `Artist: ${spotifyTrack.artist}`,
                thumbnailUrl: spotifyTrack.thumbnail || "",
                sourceUrl: spotifyTrack.url,
                mediaType: 1,
                showAdAttribution: true,
                renderLargerThumbnail: true,
              },
            },
          },
          { quoted: m }
        );
      } else {
        m.reply("⚠️ Failed to fetch Spotify audio. Trying YouTube...");
      }
    } else {
      m.reply("❌ No Spotify results found. Moving to YouTube...");
    }
  } catch (error) {
    console.error("Spotify Error:", error.message || error);
    m.reply("⚠️ Could not fetch from Spotify. Trying YouTube...");
  }

  // YouTube Downloader
  try {
    const youtubeSearch = await ytSearch(text);
    youtubeTrack = youtubeSearch.videos?.[0];

    if (youtubeTrack) {
      if (youtubeTrack.seconds >= 3600) {
        return m.reply("❌ YouTube video is over 1 hour. Choose a shorter video!");
      }

      const youtubeAudioUrl = await youtube(youtubeTrack.url);

      if (youtubeAudioUrl && youtubeAudioUrl.mp3) {
        await conn.sendMessage(
          m.chat,
          {
            audio: { url: youtubeAudioUrl.mp3 },
            mimetype: "audio/mpeg",
            contextInfo: {
              externalAdReply: {
                title: youtubeTrack.title,
                body: "From YouTube via Silva MD Bot",
                thumbnailUrl: youtubeTrack.image || "",
                sourceUrl: youtubeTrack.url,
                mediaType: 1,
                showAdAttribution: true,
                renderLargerThumbnail: true,
              },
            },
          },
          { quoted: m }
        );
      } else {
        m.reply("⚠️ Could not fetch audio from YouTube. Please try again.");
      }
    } else {
      m.reply("❌ No YouTube results found. Please refine your query.");
    }
  } catch (error) {
    console.error("YouTube Error:", error.message || error);
    m.reply(`❌ Error fetching from YouTube: ${error.message}`);
  }

  // Final Response
  if (!spotifyTrack && !youtubeTrack) {
    m.reply("❌ No results found from both Spotify and YouTube.");
  } else {
    m.reply(
      "🎶 Audio fetch complete! Enjoy your tracks and keep using Silva MD Bot! 😊\n\n🌍 World-class bot by Silva Tech Inc."
    );
  }
};

handler.help = ["play"];
handler.tags = ["downloader"];
handler.command = /^play$/i;

export default handler;

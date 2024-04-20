const {
  smd,
  fetchJson,
  fancytext,
  yt,
  getBuffer,
  smdBuffer,
  smdJson,
  pinterest,
  prefix,
  Config,
  mediafire,
} = require("../lib");
const {
  search,
  download
} = require("aptoide-scraper");
const googleTTS = require("google-tts-api");
const ytdl = require("ytdl-secktor");
const yts = require("secktor-pack");
const fs = require("fs-extra");
const axios = require("axios");
const fetch = require("node-fetch");
var videotime = 2000;
const {
  cmd
} = require("../lib/plugins");
smd(
  {
    pattern: "spotify2",
    alias: ["sp2"],
    desc: "Downloads a Spotify song.",
    category: "downloader",
    filename: __filename,
    use: "<Spotify URL>",
  },
  async (message, input) => {
    try {
      const url = input.trim();
      if (!url || !isValidUrl(url)) {
        return await message.send("*_Please provide a valid Spotify URL._*");
      }

      const apiUrl = `https://api.maher-zubair.tech/download/spotify?url=${encodeURIComponent(url)}`;
      const response = await axios.get(apiUrl);
      const data = response.data;

      if (!data || data.status !== 200) {
        return await message.reply("*Failed to download the Spotify song.*");
      }

      const { song, artist, album_name, release_date, cover_url, url: songUrl } = data.result;

      let output = `*Song:* ${song}\n`;
      output += `*Artist:* ${artist.join(", ")}\n`;
      output += `*Album:* ${album_name}\n`;
      output += `*Release Date:* ${release_date}\n\n`;
      output += `*Cover Image:* ${cover_url}\n\n`;

      const buffer = await axios.get(songUrl, { responseType: "arraybuffer" });
      const fileName = `${song.replace(/\s/g, "_")}.mp3`;

      await message.bot.sendMessage(
        message.chat,
        {
          audio: buffer.data,
          fileName: fileName,
          mimetype: "audio/mpeg",
          caption: output,
        },
        { quoted: message }
      );
    } catch (error) {
      await message.error(error + "\n\nCommand: spotify2", error, "*Failed to download the Spotify song.*");
    }
  }
);

function isValidUrl(url) {
  try {
    new URL(url);
    return true;
  } catch (_) {
    return false;
  }
}
smd(
  {
    pattern: "spotify",
    alias: ["sp"],
    desc: "Searches for Spotify tracks.",
    category: "search",
    filename: __filename,
    use: "<search query>",
  },
  async (message, input) => {
    try {
      const query = input.trim();
      if (!query) {
        return await message.send("*_Please provide a search query._*");
      }

      const apiUrl = `https://api.maher-zubair.tech/search/spotify?q=${encodeURIComponent(query)}`;
      const response = await axios.get(apiUrl);
      const data = response.data;

      if (!data || data.status !== 200) {
        return await message.reply("*Failed to fetch Spotify tracks.*");
      }

      const tracks = data.result;
      if (!tracks || tracks.length === 0) {
        return await message.reply("*No Spotify tracks found.*");
      }

      let output = "*Spotify Search Results:*\n\n";
      for (let i = 0; i < tracks.length; i++) {
        const track = tracks[i];
        output += `*${i + 1}. ${track.title}*\n`;
        output += `Artist: ${track.artist}\n`;
        output += `Duration: ${formatDuration(track.duration)}\n`;
        output += `Popularity: ${track.popularity}\n`;
        output += `Preview: ${track.preview ? track.preview : "No preview available"}\n`;
        output += `URL: ${track.url}\n\n`;
      }

      return await message.send(output, { quoted: message });
    } catch (error) {
      await message.error(error + "\n\nCommand: spotify", error, "*Failed to search Spotify.*");
    }
  }
);

function formatDuration(durationMs) {
  const seconds = Math.floor((durationMs / 1000) % 60);
  const minutes = Math.floor((durationMs / (1000 * 60)) % 60);
  const hours = Math.floor((durationMs / (1000 * 60 * 60)) % 24);
  return `${hours ? `${hours}h ` : ""}${minutes}m ${seconds}s`;
}
smd(
  {
    pattern: "twitter",
    alias: ["tw", "twdl"],
    desc: "Downloads Twitter videos.",
    category: "downloader",
    filename: __filename,
    use: "<add Twitter URL>",
  },
  async (message, input) => {
    try {
      let query = input.split(" ")[0].trim();
      if (!query || !query.startsWith("https://")) {
        return await message.send(
          "*_Please provide a valid Twitter Video URL._*\n*Example: " +
            prefix +
            "tw https://twitter.com/username/status/1234567890_*"
        );
      }

      let video = await smdJson(
        "https://api.maher-zubair.tech/download/twitter?url=" + query
      );

      if (!video || !video.status === 200) {
        return await message.reply("*Invalid Video URL!*");
      }

      let caption = video.data.caption
        ? video.data.caption
        : `*Twitter Video Download*\n\n*Username:* ${video.data.username}`;

      return await message.bot.sendMessage(
        message.chat,
        {
          video: { url: video.data.HD },
          caption: caption,
        },
        { quoted: message }
      );
    } catch (error) {
      await message.error(error + "\n\nCommand: twitter", error, "*_Video not found!_*");
    }
  }
);

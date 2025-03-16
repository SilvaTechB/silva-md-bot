import axios from "axios";
import ytSearch from "yt-search";

let handler = async (m, { conn, text }) => {
  if (!text) return m.reply("❌ *Oops! What song do you want to download?*");

  let loadingMsg = await m.reply("⏳ *Silva MD Bot is searching for your song... Please wait...*");

  try {
    let search = await ytSearch(text);
    let video = search.videos[0];

    if (!video) return m.reply("🚫 *No results found! Try a different song name.*");

    let link = video.url;
    let apis = [
      `https://apis.davidcyriltech.my.id/youtube/mp3?url=${link}`,
      `https://api.ryzendesu.vip/api/downloader/ytmp3?url=${link}`,
      `https://api.akuari.my.id/downloader/youtubeaudio?link=${link}`
    ];

    // Fetch from the first working API
    let response;
    for (let api of apis) {
      try {
        response = await axios.get(api);
        if (response.data.status === 200 || response.data.success) break; // Exit loop if success
      } catch (error) {
        console.error(`❌ API Error: ${api} - ${error.message}`);
        continue; // Try the next API
      }
    }

    if (!response || !response.data || !(response.data.status === 200 || response.data.success)) {
      return m.reply("⚠️ *All servers failed! The APIs might be down, please try again later.*");
    }

    let data = response.data.result || response.data;
    let audioUrl = data.downloadUrl || data.url;
    let songData = {
      title: data.title || video.title,
      artist: data.author || video.author.name,
      thumbnail: data.image || video.thumbnail
    };

    // Delete loading message
    await conn.sendMessage(m.chat, { delete: loadingMsg.key });

    let caption = `🎧 *Silva MD Bot - Music Download* 🎶

📌 *Title:* ${songData.title}
👤 *Artist:* ${songData.artist}
🎵 *Status:* ✅ Success
🚀 *Powered by Silva MD Bot*`;

    await conn.sendMessage(m.chat, {
      image: { url: songData.thumbnail },
      caption: caption,
      contextInfo: {
        mentionedJid: [m.sender],
        forwardingScore: 999,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
          newsletterJid: '120363200367779016@newsletter',
          newsletterName: 'SILVA MUSIC PLAYER 💖',
          serverMessageId: 143
        }
      }
    });

    // Send audio file
    await conn.sendMessage(m.chat, {
      audio: { url: audioUrl },
      mimetype: "audio/mp4",
      contextInfo: {
        mentionedJid: [m.sender],
        forwardingScore: 999,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
          newsletterJid: '120363200367779016@newsletter',
          newsletterName: 'SILVA MUSIC PLAYER 💖',
          serverMessageId: 143
        }
      }
    });

    // Send MP3 as document
    await conn.sendMessage(m.chat, {
      document: { url: audioUrl },
      mimetype: "audio/mp3",
      fileName: `${songData.title.replace(/[^a-zA-Z0-9 ]/g, "")}.mp3`,
      contextInfo: {
        mentionedJid: [m.sender],
        forwardingScore: 999,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
          newsletterJid: '120363200367779016@newsletter',
          newsletterName: 'SILVA MUSIC PLAYER 💖',
          serverMessageId: 143
        }
      }
    });

    m.reply("✅ *Silva MD Bot successfully delivered your audio! Enjoy 🎶*");

  } catch (error) {
    console.error("❌ Error:", error.message);
    m.reply("❌ *Something went wrong! Please try again later.*");
  }
};

handler.help = ["song"];
handler.tags = ["downloader"];
handler.command = /^song$/i;

export default handler;

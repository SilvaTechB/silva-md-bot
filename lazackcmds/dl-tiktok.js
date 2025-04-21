import fetch from 'node-fetch';

let handler = async (message, { conn, args }) => {
  const link = args[0];

  if (!link || !link.includes("tiktok.com")) {
    return message.reply("Please provide a valid TikTok link!");
  }

  message.reply("*Fetching TikTok video, please wait...*");

  try {
    const response = await fetch("https://api.tiklydown.eu.org/api/download?url=" + encodeURIComponent(link));
    const data = await response.json();

    if (data.video && data.video.noWatermark) {
      const videoLink = data.video.noWatermark;
      const audioLink = data.audio;
      const caption = `
*🟣 SILVA MD TIKTOK DOWNLOADER*

*🎥 Video by*: _${data.author.name || "Unknown"}_ (@${data.author.unique_id || "N/A"})
❤️ Likes: ${data.stats.likeCount || 0}
💬 Comments: ${data.stats.commentCount || 0}
🔁 Shares: ${data.stats.shareCount || 0}
▶️ Plays: ${data.stats.playCount || 0}
💾 Saves: ${data.stats.saveCount || 0}

⏤͟͟͞͞ Downloader By Silva MD Bot

Reply with:
1️⃣ for Standard Video
2️⃣ for High Quality Video
3️⃣ for Audio
`;

      const videoMsg = await conn.sendMessage(message.chat, {
        video: { url: videoLink },
        caption
      }, { quoted: message });

      const msgID = videoMsg.key.id;

      conn.ev.on("messages.upsert", async event => {
        const incomingMsg = event.messages[0];
        if (!incomingMsg.message) return;

        const userText = incomingMsg.message.conversation || incomingMsg.message.extendedTextMessage?.text;
        const fromJid = incomingMsg.key.remoteJid;
        const isReplyToBot = incomingMsg.message.extendedTextMessage?.contextInfo?.stanzaId === msgID;

        if (isReplyToBot) {
          // React with ⬇️ emoji
          await conn.sendMessage(fromJid, {
            react: {
              text: '⬇️',
              key: incomingMsg.key
            }
          });

          if (userText === '1') {
            await conn.sendMessage(fromJid, {
              video: { url: videoLink },
              caption: "Here is the video in Standard Quality."
            });
          } else if (userText === '2') {
            await conn.sendMessage(fromJid, {
              video: { url: videoLink },
              caption: "Here is the video in High Quality."
            });
          } else if (userText === '3') {
            await conn.sendMessage(fromJid, {
              audio: { url: audioLink },
              mimetype: 'audio/mp4',
              ptt: false,
              fileName: "tiktok_audio.mp3"
            });
          }
        }
      });

    } else {
      message.reply("❌ Could not fetch video. Try again later.");
    }
  } catch (error) {
    console.error(error);
    message.reply("❌ Failed to download video.");
  }
};

handler.help = ["tiktok"];
handler.tags = ["downloader"];
handler.command = ["tiktok", "ttdl"];

export default handler;

import fetch from 'node-fetch';

let handler = async (m, { conn, args }) => {
  const link = args[0];

  if (!link || !link.includes("tiktok.com")) {
    return m.reply("🚫 *Please provide a valid TikTok link!*");
  }

  const waitMsg = await m.reply("⏳ *Fetching your TikTok video...*");

  try {
    const res = await fetch("https://api.tiklydown.eu.org/api/download?url=" + encodeURIComponent(link));
    const data = await res.json();

    if (data?.video?.noWatermark) {
      const videoUrl = data.video.noWatermark;
      const audioUrl = data.audio;
      const caption = `
🎵 *TIKTOK MEDIA DOWNLOADER*
┌───⭓
│👤 *Creator:* _${data.author.name || "Unknown"}_ (@${data.author.unique_id || "N/A"})
│❤️ *Likes:* ${data.stats.likeCount || 0}
│💬 *Comments:* ${data.stats.commentCount || 0}
│🔁 *Shares:* ${data.stats.shareCount || 0}
│▶️ *Plays:* ${data.stats.playCount || 0}
│💾 *Saves:* ${data.stats.saveCount || 0}
└────────────⭓

🧠 _Powered by: Silva MD Bot_

💬 *Reply with:*
1️⃣ - Standard Video  
2️⃣ - High Quality Video  
3️⃣ - Audio Only
`.trim();

      // Delete the wait message
      await conn.sendMessage(m.chat, { delete: waitMsg.key });

      // Send video with newsletter style
      const videoMsg = await conn.sendMessage(m.chat, {
        video: { url: videoUrl },
        caption,
        contextInfo: {
          mentionedJid: [m.sender],
          forwardingScore: 999,
          isForwarded: true,
          forwardedNewsletterMessageInfo: {
            newsletterJid: '120363200367779016@newsletter',
            newsletterName: 'SILVA MD BOT 💖',
            serverMessageId: 143
          }
        }
      }, { quoted: m });

      const msgID = videoMsg.key.id;

      // Handle reply options
      conn.ev.on("messages.upsert", async event => {
        const incoming = event.messages[0];
        if (!incoming.message) return;

        const userText = incoming.message.conversation || incoming.message.extendedTextMessage?.text;
        const fromJid = incoming.key.remoteJid;
        const isReplyToBot = incoming.message.extendedTextMessage?.contextInfo?.stanzaId === msgID;

        if (isReplyToBot) {
          await conn.sendMessage(fromJid, {
            react: { text: '⬇️', key: incoming.key }
          });

          if (userText === '1') {
            await conn.sendMessage(fromJid, {
              video: { url: videoUrl },
              caption: "🎬 *Standard Quality Video*",
              contextInfo: forwardedInfo(m)
            });
          } else if (userText === '2') {
            await conn.sendMessage(fromJid, {
              video: { url: videoUrl },
              caption: "📽️ *High Quality Video*",
              contextInfo: forwardedInfo(m)
            });
          } else if (userText === '3') {
            await conn.sendMessage(fromJid, {
              audio: { url: audioUrl },
              mimetype: 'audio/mp4',
              ptt: false,
              fileName: "tiktok_audio.mp3",
              contextInfo: forwardedInfo(m)
            });
          }
        }
      });

    } else {
      await conn.sendMessage(m.chat, { delete: waitMsg.key });
      m.reply("❌ *Failed to retrieve TikTok video. Please try again later.*");
    }

  } catch (err) {
    console.error(err);
    await conn.sendMessage(m.chat, { delete: waitMsg.key });
    m.reply("❌ *An error occurred while downloading the video.*");
  }
};

// Helper for clean contextInfo reuse
function forwardedInfo(m) {
  return {
    mentionedJid: [m.sender],
    forwardingScore: 999,
    isForwarded: true,
    forwardedNewsletterMessageInfo: {
      newsletterJid: '120363200367779016@newsletter',
      newsletterName: 'SILVA MD BOT 💖',
      serverMessageId: 143
    }
  };
}

handler.help = ["tiktok"];
handler.tags = ["downloader"];
handler.command = ["tiktok", "ttdl"];

export default handler;

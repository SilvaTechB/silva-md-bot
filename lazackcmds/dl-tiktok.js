import fetch from 'node-fetch';

let handler = async (m, { conn, args }) => {
  let url = args[0];
  if (!url || !url.includes('tiktok.com')) {
    return m.reply("⚠️ *Please provide a valid TikTok link!*\nExample: `.tiktok https://www.tiktok.com/@user/video/123456789`");
  }

  m.reply("🔄 *Fetching TikTok video, please wait...*");

  try {
    let res = await fetch(`https://api.tiklydown.eu.org/api/download?url=${encodeURIComponent(url)}`);
    let data = await res.json();

    if (!data || !data.data || !data.data.play || !data.data.audio) {
      return m.reply("❌ *Failed to download video. Please check the link or try again later.*");
    }

    const { play, hd, audio } = data.data;
    const caption = `
🎬 *TIKTOK DOWNLOADER*

✅ Video Available
🎧 Audio Available

🔘 Reply with:
1️⃣ Video (No Watermark)
2️⃣ Video (HD Quality)
3️⃣ Audio Only

🎯 Powered by Silva MD Bot
`.trim();

    let sent = await conn.sendMessage(m.chat, {
      video: { url: play },
      caption,
      contextInfo: {
        mentionedJid: [m.sender],
        forwardingScore: 999,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
          newsletterJid: '120363200367779016@newsletter',
          newsletterName: 'SILVA MD BOT 💖',
          serverMessageId: 143
        },
        externalAdReply: {
          title: "Silva MD TikTok Downloader",
          body: "Download videos & audio from TikTok without watermark!",
          thumbnailUrl: "https://telegra.ph/file/e88f6f3a9878fe6d20fcb.jpg",
          mediaType: 1,
          mediaUrl: url,
          sourceUrl: "https://github.com/SilvaTechInc/Silva-MD"
        }
      }
    }, { quoted: m });

    let messageId = sent.key.id;

    conn.ev.on("messages.upsert", async (update) => {
      let msg = update.messages[0];
      if (!msg.message) return;

      let reply = msg.message.conversation || msg.message.extendedTextMessage?.text;
      let jid = msg.key.remoteJid;
      let isReplyToBot = msg.message.extendedTextMessage?.contextInfo?.stanzaId === messageId;

      if (isReplyToBot) {
        await conn.sendMessage(jid, {
          react: { text: '⬇️', key: msg.key }
        });

        if (reply === "1") {
          await conn.sendMessage(jid, {
            video: { url: play },
            caption: "🎥 Here's your TikTok video (No Watermark)"
          }, { quoted: msg });
        } else if (reply === "2") {
          await conn.sendMessage(jid, {
            video: { url: hd || play },
            caption: "📽️ Here's your TikTok video (HD Quality)"
          }, { quoted: msg });
        } else if (reply === "3") {
          await conn.sendMessage(jid, {
            audio: { url: audio },
            mimetype: "audio/mp4",
            ptt: false,
            fileName: "tiktok-audio.m4a"
          }, { quoted: msg });
        }
      }
    });

  } catch (error) {
    console.error(error);
    m.reply("⚠️ *Error fetching TikTok content. Please try again later.*");
  }
};

handler.command = ["tiktok", "ttdl", "tt"];
handler.help = ["tiktok <url>"];
handler.tags = ["downloader"];

export default handler;

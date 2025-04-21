let handler = async (m, { conn, args, usedPrefix, command }) => {
  if (!args[0]) {
    return m.reply(`💖 *TIKTOK VIDEO DOWNLOADER*\n\nPlease provide a valid TikTok link.\n\n📌 Example:\n${usedPrefix + command} https://www.tiktok.com/@username/video/1234567890`);
  }

  let url = args[0];
  if (!url.includes("tiktok.com")) {
    return m.reply("❌ *Invalid link.* Please provide a TikTok video URL.");
  }

  try {
    let api = `https://api.tiklydown.eu.org/api/download?url=${encodeURIComponent(url)}`;
    let res = await fetch(api);
    let data = await res.json();

    if (!data.status || !data.data || !data.data.play) {
      return m.reply("❌ *Failed to download video. The link might be invalid or unsupported.*");
    }

    await conn.sendFile(
      m.chat,
      data.data.play,
      "tiktok.mp4",
      `✅ *Downloaded TikTok Video*\n\n📥 URL: ${url}\n🎬 Resolution: HD\n\n🔗 Powered by Silva MD Bot 💖`,
      m,
      false,
      {
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
      }
    );
  } catch (e) {
    console.error(e);
    m.reply("⚠️ *An error occurred while processing your request.* Please try again later.");
  }
};

handler.help = ["tiktok"].map(v => v + " <url>");
handler.tags = ['downloader'];
handler.command = ["tiktok", "tt"];
handler.limit = true;
handler.premium = false;

export default handler;

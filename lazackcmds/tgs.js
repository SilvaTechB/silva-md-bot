const axios = require("axios");
const { Sticker, StickerTypes } = require("wa-sticker-formatter");

const BOT_TOKEN = "7025486524:AAGNJ3lMa8610p7OAIycwLtNmF9vG8GfboM";
const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

let handler = async (m, { conn, text }) => {
  if (!text) {
    return conn.sendMessage(m.chat, { text: "❌ Please provide a sticker pack link!" }, { quoted: m });
  }

  try {
    let name = text.split("/addstickers/")[1];
    if (!name) throw new Error("Invalid sticker pack link!");

    let apiUrl = `${TELEGRAM_API}/getStickerSet?name=${encodeURIComponent(name)}`;
    let { data } = await axios.get(apiUrl);

    if (!data.result || !data.result.stickers.length) {
      throw new Error("Sticker pack not found or empty!");
    }

    let isAnimated = data.result.is_animated || data.result.is_video;
    let packInfo = `*🎨 Sticker Pack Found!*\n\n📛 *Name:* ${data.result.name}\n🎭 *Type:* ${isAnimated ? "Animated" : "Static"}\n📦 *Stickers:* ${data.result.stickers.length}\n\n⏳ *Downloading...*`;

    await conn.sendMessage(m.chat, { text: packInfo }, { quoted: m });

    for (const sticker of data.result.stickers) {
      try {
        let fileRes = await axios.get(`${TELEGRAM_API}/getFile?file_id=${sticker.file_id}`);
        let filePath = fileRes.data.result.file_path;

        let stickerBuffer = await axios({
          method: "get",
          url: `https://api.telegram.org/file/bot${BOT_TOKEN}/${filePath}`,
          responseType: "arraybuffer",
        });

        let stickerObj = new Sticker(stickerBuffer.data, {
          pack: "Silva MD",
          author: "Silva",
          type: StickerTypes.FULL,
          categories: ["🤩", "🎉"],
          id: Date.now().toString(),
          quality: 70,
          background: "#000000",
        });

        await conn.sendMessage(m.chat, { sticker: await stickerObj.toBuffer() }, { quoted: m });
        await sleep(1000);
      } catch (stickerError) {
        console.error("Sticker processing error:", stickerError.message);
      }
    }
  } catch (error) {
    await conn.sendMessage(m.chat, { text: `❌ Error: ${error.message}` }, { quoted: m });
  }
};

handler.help = ["tgs"];
handler.tags = ["sticker"];
handler.command = ["tgs"];

module.exports = handler;

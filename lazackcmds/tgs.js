const axios = require("axios");
const { Sticker, StickerTypes } = require("wa-sticker-formatter");

const sleep = (ms) => {
  return new Promise((resolve) => { setTimeout(resolve, ms) });
};

module.exports = async (context) => {
  const { client, m, author, text, botname } = context;

  if (!text) {
    await client.sendMessage(m.chat, { text: "Provide a search term for the sticker!" }, { quoted: m });
    return;
  }

  let lien = text;
  let name = lien.split('/addstickers/')[1];
  let api = `https://api.telegram.org/bot7025486524:AAGNJ3lMa8610p7OAIycwLtNmF9vG8GfboM/getStickerSet?name=${encodeURIComponent(name)}`;

  try {
    let stickers = await axios.get(api);
    let type = stickers.data.result.is_animated || stickers.data.result.is_video ? 'animated sticker' : 'not animated sticker';

    let msg = `*Silva Md tgsticker*\n\n*Name:* ${stickers.data.result.name}\n*Type:* ${type}\n*Length:* ${stickers.data.result.stickers.length}\n\nsilva Downloading...`;

    await client.sendMessage(m.chat, { text: msg }, { quoted: m });

    for (let i = 0; i < stickers.data.result.stickers.length; i++) {
      let file = await axios.get(`https://api.telegram.org/bot7025486524:AAGNJ3lMa8610p7OAIycwLtNmF9vG8GfboM/getFile?file_id=${stickers.data.result.stickers[i].file_id}`);
      let buffer = await axios({
        method: 'get',
        url: `https://api.telegram.org/file/bot7025486524:AAGNJ3lMa8610p7OAIycwLtNmF9vG8GfboM/${file.data.result.file_path}`,
        responseType: 'arraybuffer',
      });

      const sticker = new Sticker(buffer.data, {
        pack: botname,
        author: author,
        type: StickerTypes.FULL,
        categories: ['🤩', '🎉'],
        id: '12345',
        quality: 50,
        background: '#000000'
      });

      const stickerBuffer = await sticker.toBuffer(); // Convert the sticker to a buffer

      await client.sendMessage(
        m.chat,
        {
          sticker: stickerBuffer, // Use the buffer directly in the message object
        },
        { quoted: m }
      );
    }

  } catch (error) {
    await client.sendMessage(m.chat, { text: `We got an error: ${error.message}` }, { quoted: m });
  }
};
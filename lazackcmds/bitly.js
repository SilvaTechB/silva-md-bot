import { bitly } from '@shizodevs/wabotmodule';

let handler = async (m, { conn, args }) => {
  try {
    const longURL = args[0];
    if (!longURL) {
      return conn.reply(m.chat, 'Please provide a long URL.', m);
    }
    const { shortURL, qrCode } = await bitly(longURL);
    await conn.sendFile(m.chat, qrCode, 'qrcode.png', `Successfuly Shorted Your Link ✅
🏴‍☠️ *Original Link:* ${longURL}
🧟‍♂️ *Shorted Link:* ` + shortURL + `
📢 *Powered by:* Bit.ly
👨‍🎓 *Developer:* ${author}`, m);
  } catch (error) {
    console.error(error);
    conn.reply(m.chat, 'Failed to create short URL and QR code.\n' + error, m);
  }
};
handler.help = ['shortlink <longLink>', 'bitly <longlink>'];
handler.tags = ['tools'];
handler.command = /^(shortlink|bitly)$/i;

export default handler;

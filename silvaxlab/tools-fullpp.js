import fs from 'fs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const Jimp = require("jimp"); // Using Jimp for image processing

let handler = async (m, { text, conn, command, usedPrefix }) => {
  let message = m.quoted ? m.quoted : m;
  let mimeType = (message.msg ? message.msg : message).mimetype ? message.mimetype : message.mediaType || '';
  
  if (/image/g.test(mimeType) && !/webp/g.test(mimeType)) {
    try {
      let downloadedImage = await message.download();
      let botJid = await conn.user.jid;

      // Processing the image using the 'pepe' function
      let { img } = await processImage(downloadedImage);

      // Sending the image to the bot's profile
      await conn.query({
        tag: 'iq',
        attrs: {
          to: botJid,
          type: 'set',
          xmlns: "w:profile:picture"
        },
        content: [{
          tag: "picture",
          attrs: {
            type: "image"
          },
          content: img
        }]
      });
      
      m.reply("SilvaBot has successfully updated your profile picture.");
    } catch (error) {
      console.error(error);
      m.reply("An error occurred while processing the image. Please try again later.");
    }
  } else {
    m.reply(`Send an image with the caption "${usedPrefix + command}" or tag an image that has already been sent.`);
  }
};

handler.help = ['setppbotfull'];
handler.tags = ["owner"];
handler.command = /^(fullpp)$/i;
handler.owner = true;

export default handler;

// Image processing function using Jimp
async function processImage(imageBuffer) {
  try {
    const image = await Jimp.read(imageBuffer);
    const width = image.getWidth();
    const height = image.getHeight();

    // Cropping and resizing the image
    const croppedImage = image.crop(0, 0, width, height);
    const img = await croppedImage.scaleToFit(720, 720).getBufferAsync(Jimp.MIME_JPEG); // Resize to 720x720 for profile picture

    return { img };
  } catch (error) {
    throw new Error("Failed to process the image.");
  }
}

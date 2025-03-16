import fs from "fs";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const Jimp = require("jimp"); // Using Jimp for image processing

let handler = async (m, { conn, command, usedPrefix }) => {
    let message = m.quoted ? m.quoted : m;
    let mimeType = message.mimetype || message.mediaType || "";

    if (!mimeType || !mimeType.startsWith("image/")) {
        return m.reply(`⚠️ *Send an image with the caption* \`${usedPrefix + command}\` *or tag an image that has already been sent.*`);
    }

    try {
        let downloadedImage = await conn.downloadMediaMessage(message);
        if (!downloadedImage) throw new Error("Failed to download the image.");

        let botJid = conn.user.jid;
        let processedImage = await processImage(downloadedImage);

        // Sending the image to update the bot's profile picture
        await conn.query({
            tag: "iq",
            attrs: {
                to: botJid,
                type: "set",
                xmlns: "w:profile:picture",
            },
            content: [
                {
                    tag: "picture",
                    attrs: { type: "image" },
                    content: processedImage,
                },
            ],
        });

        m.reply("✅ *Silva MD Bot's profile picture has been successfully updated!* 🎨");

    } catch (error) {
        console.error("❌ Profile Picture Update Error:", error);
        m.reply("⚠️ *An error occurred while updating the profile picture. Please try again!*");
    }
};

handler.help = ["setppbotfull"];
handler.tags = ["owner"];
handler.command = /^(fullpp)$/i;
handler.owner = true;

export default handler;

// 🔹 Image processing function using Jimp
async function processImage(imageBuffer) {
    try {
        const image = await Jimp.read(imageBuffer);
        const resizedImage = await image.scaleToFit(720, 720).quality(80).getBufferAsync(Jimp.MIME_JPEG);
        return resizedImage;
    } catch (error) {
        throw new Error("⚠️ Failed to process the image.");
    }
}

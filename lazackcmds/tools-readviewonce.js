import uploadtoimgur from "../lib/imgur.js";
import fs from "fs";
import path from "path";
import axios from "axios";

let handler = async (m) => {
    let message = m.quoted ? m.quoted : m;
    let mimeType = message.mimetype || "";

    if (!mimeType) {
        return m.reply("❌ *Please reply to an image or video to upload!*");
    }

    try {
        let mediaBuffer = await message.download();
        let fileSizeMB = (mediaBuffer.length / (1024 * 1024)).toFixed(2);

        if (mediaBuffer.length > 10 * 1024 * 1024) {
            return m.reply("⚠️ *Media size exceeds 10MB. Please upload a smaller file!*");
        }

        let tmpDir = path.join(process.cwd(), "tmp");
        if (!fs.existsSync(tmpDir)) {
            fs.mkdirSync(tmpDir, { recursive: true });
        }

        let fileExtension = mimeType.split("/")[1] || "unknown";
        let mediaPath = path.join(tmpDir, `media_${Date.now()}.${fileExtension}`);

        fs.writeFileSync(mediaPath, mediaBuffer);

        let isSupportedMedia = /image\/(png|jpe?g|gif)|video\/mp4/.test(mimeType);

        if (isSupportedMedia) {
            let uploadLink = await uploadtoimgur(mediaPath);

            await m.reply(`✅ *SILVA VIEW ONCE MESSAGE UPLOADED!*\n📁 *File Size:* ${fileSizeMB} MB\n🔗 *MEDIA URL:* ${uploadLink}\n\n🖼️ Sending preview...`);

            // 👉 Fetch the uploaded media and resend it as an image
            if (mimeType.startsWith("image/")) {
                const imageRes = await axios.get(uploadLink, { responseType: "arraybuffer" });
                const imageBuffer = Buffer.from(imageRes.data, "binary");

                await m.conn.sendMessage(m.chat, {
                    image: imageBuffer,
                    caption: "*📎 Uploaded Image Preview*"
                }, { quoted: m });
            } else if (mimeType === "video/mp4") {
                const videoRes = await axios.get(uploadLink, { responseType: "arraybuffer" });
                const videoBuffer = Buffer.from(videoRes.data, "binary");

                await m.conn.sendMessage(m.chat, {
                    video: videoBuffer,
                    caption: "*🎞️ Uploaded Video Preview*"
                }, { quoted: m });
            }

        } else {
            await m.reply(`⚠️ *Sorry, unsupported file type!*\n📁 *Size:* ${fileSizeMB} MB`);
        }

        fs.unlinkSync(mediaPath);

    } catch (error) {
        console.error("❌ Media Upload Error:", error);
        return m.reply("⚠️ *An error occurred while uploading the media. Please try again!*");
    }
};

handler.help = ["vv"];
handler.tags = ["tools"];
handler.command = ["vv", "view"];

export default handler;

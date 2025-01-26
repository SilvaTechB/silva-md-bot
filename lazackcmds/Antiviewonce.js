import { downloadContentFromMessage } from "@whiskeysockets/baileys";

let handler = message => message;

handler.before = async function (msg, { conn }) {
  // Check if ANTIVIEWONCE is enabled
  if (process.env.ANTIVIEWONCE !== "true") {
    console.log("Anti-View Once is disabled.");
    return;
  }

  try {
    // Verify if the message is a view-once type
    if (["viewOnceMessageV2", "viewOnceMessageV2Extension"].includes(msg.mtype)) {
      const viewOnceContent =
        msg.mtype === "viewOnceMessageV2"
          ? msg.message.viewOnceMessageV2.message
          : msg.message.viewOnceMessageV2Extension.message;

      const mediaType = Object.keys(viewOnceContent)[0];
      if (!["imageMessage", "videoMessage", "audioMessage"].includes(mediaType)) return;

      // Download the media content
      const downloadType = mediaType.replace("Message", "").toLowerCase();
      const mediaStream = await downloadContentFromMessage(viewOnceContent[mediaType], downloadType);
      const mediaBuffer = Buffer.concat(await toBuffer(mediaStream));

      // Format file size
      const fileSize = formatFileSize(viewOnceContent[mediaType].fileLength);

      // Compose information message
      const infoMessage = `
*💀💀 SILVA MD ANTI VIEW ONCE 💀💀*
*Type:* ${mediaType === "imageMessage" ? "Image 📸" : mediaType === "videoMessage" ? "Video 📹" : "Audio 🎵"}
*Size:* \`${fileSize}\`
*User:* @${msg.sender.split("@")[0]}
${viewOnceContent[mediaType].caption ? "*Caption:* " + viewOnceContent[mediaType].caption : ""}
      `.trim();

      // Define the context info
      const contextInfo = {
        mentionedJid: [msg.sender],
        forwardingScore: 999,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
          newsletterJid: "120363200367779016@newsletter",
          newsletterName: "ANTIVIEWONCE SILVA MD🥰",
          serverMessageId: 143,
        },
      };

      // Handle media message types
      if (["imageMessage", "videoMessage"].includes(mediaType)) {
        const fileExtension = mediaType === "imageMessage" ? ".jpg" : ".mp4";
        await conn.sendFile(
          msg.chat,
          mediaBuffer,
          `view_once${fileExtension}`,
          infoMessage,
          msg,
          false,
          { mentions: [msg.sender], contextInfo }
        );
      } else if (mediaType === "audioMessage") {
        await conn.reply(msg.chat, infoMessage, msg, { mentions: [msg.sender], contextInfo });
        await conn.sendMessage(
          msg.chat,
          {
            audio: mediaBuffer,
            fileName: "view_once.mp3",
            mimetype: "audio/mpeg",
            ptt: true,
            contextInfo,
          },
          { quoted: msg }
        );
      }
    }
  } catch (error) {
    console.error("Error processing view-once message:", error);
    msg.reply("❌ *An error occurred while processing the view-once message.*");
  }
};

export default handler;

// Utility: Convert a stream into a buffer
async function toBuffer(stream) {
  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  return chunks;
}

// Utility: Format file sizes into a human-readable format
function formatFileSize(sizeInBytes) {
  const units = ["Bytes", "KB", "MB", "GB", "TB"];
  const unitIndex = Math.floor(Math.log(sizeInBytes) / Math.log(1024));
  return `${(sizeInBytes / Math.pow(1024, unitIndex)).toFixed(2)} ${units[unitIndex]}`;
}

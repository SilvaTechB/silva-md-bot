import { downloadContentFromMessage } from "@whiskeysockets/baileys";

// Handler for processing view-once messages
let handler = message => message;

handler.before = async function (msg, { conn }) {
  // Check if ANTIVIEWONCE is enabled
  if (process.env.ANTIVIEWONCE !== "true") {
    console.log("Anti-View Once is disabled.");
    return;
  }

  try {
    // Check if the message is a view-once type
    if (["viewOnceMessageV2", "viewOnceMessageV2Extension"].includes(msg.mtype)) {
      const viewOnceContent = 
        msg.mtype === "viewOnceMessageV2"
          ? msg.message.viewOnceMessageV2.message
          : msg.message.viewOnceMessageV2Extension.message;

      const mediaType = Object.keys(viewOnceContent)[0];
      if (!["imageMessage", "videoMessage", "audioMessage"].includes(mediaType)) return;

      // Download media content
      const downloadType = mediaType.replace("Message", "").toLowerCase();
      const mediaStream = await downloadContentFromMessage(viewOnceContent[mediaType], downloadType);

      // Collect media data into a buffer
      const mediaBuffer = Buffer.concat(await toBuffer(mediaStream));

      // Format file size
      const fileSize = formatFileSize(viewOnceContent[mediaType].fileLength);

      // Compose info message
      const infoMessage = `
*💀💀 SILVA MD ANTI VIEW ONCE 💀💀*
*Type:* ${mediaType === "imageMessage" ? "Image 📸" : mediaType === "videoMessage" ? "Video 📹" : "Voice Message"}
*Size:* \`${fileSize}\`
*User:* @${msg.sender.split("@")[0]}
${viewOnceContent[mediaType].caption ? "*Caption:* " + viewOnceContent[mediaType].caption : ""}
      `.trim();

      // Send the media and info message
      if (mediaType === "imageMessage" || mediaType === "videoMessage") {
        const fileExtension = mediaType === "imageMessage" ? ".jpg" : ".mp4";
        await conn.sendFile(
          conn.user.id,
          mediaBuffer,
          `view_once${fileExtension}`,
          infoMessage,
          msg,
          false,
          { mentions: [msg.sender] }
        );
      } else if (mediaType === "audioMessage") {
        await conn.reply(conn.user.id, infoMessage, msg, { mentions: [msg.sender] });
        await conn.sendMessage(
          conn.user.id,
          { audio: mediaBuffer, fileName: "view_once.mp3", mimetype: "audio/mpeg", ptt: true },
          { quoted: msg }
        );
      }
    }
  } catch (error) {
    console.error("Error processing view-once message:", error.message);
  }
};

// Export the handler
export default handler;

// Utility function: Convert a stream into a buffer
async function toBuffer(stream) {
  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  return chunks;
}

// Utility function: Format file sizes in a human-readable format
function formatFileSize(sizeInBytes) {
  const units = ["Bytes", "KB", "MB", "GB", "TB"];
  const unitIndex = Math.floor(Math.log(sizeInBytes) / Math.log(1024));
  return `${(sizeInBytes / Math.pow(1024, unitIndex)).toFixed(2)} ${units[unitIndex]}`;
}

import { downloadContentFromMessage } from "@whiskeysockets/baileys";

let handler = (message) => message;

handler.before = async function (message, { conn }) {
  let content;
  let messageType;
  let messageDetails;

  // Check if the message is a view-once message
  if (message.mtype === "viewOnceMessageV2" || message.mtype === "viewOnceMessageV2Extension") {
    messageDetails = message.mtype === "viewOnceMessageV2" ? message.message.viewOnceMessageV2.message : message.message.viewOnceMessageV2Extension.message;
    messageType = Object.keys(messageDetails)[0];

    // Download the appropriate content based on message type
    if (["imageMessage", "videoMessage", "audioMessage"].includes(messageType)) {
      content = await downloadContentFromMessage(messageDetails[messageType], messageType === "imageMessage" ? "image" : messageType === "videoMessage" ? "video" : "audio");
    } else {
      return;
    }

    let buffer = Buffer.from([]);
    for await (const chunk of content) {
      buffer = Buffer.concat([buffer, chunk]);
    }

    const fileSize = formatFileSize(messageDetails[messageType].fileLength);
    const caption = messageDetails[messageType].caption ? *Caption:* ${messageDetails[messageType].caption} : '';
    const responseMessage = \n*🌠SILVA MD ANTI VIEW ONCE 🌠*\n*Type:* ${messageType === "imageMessage" ? "Image 📸" : messageType === "videoMessage" ? "Video 📹" : "Voice Message 🎤"}\n*Size:* \${fileSize}\\n*User:* *@${message.sender.split("@")[0]}*\n${caption}\n.trim();

    // Sending files or messages based on the type
    if (messageType === "imageMessage" || messageType === "videoMessage") {
      return await conn.sendFile(conn.user.id, buffer, messageType === "imageMessage" ? "error.jpg" : "error.mp4", responseMessage, message, false, {
        "mentions": [message.sender]
      });
    }

    if (messageType === "audioMessage") {
      await conn.reply(conn.user.id, responseMessage, message, {
        "mentions": [message.sender]
      });
      const audioMessage = {
        audio: buffer,
        fileName: "error.mp3",
        mimetype: "audio/mpeg",
        ptt: true
      };
      const options = {
        quoted: message
      };
      await conn.sendMessage(conn.user.id, audioMessage, options);
    }
  }
};

export default handler;

// Function to format file size
function formatFileSize(size) {
  const units = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB"];
  const index = Math.floor(Math.log(size) / Math.log(1024));
  return ${Math.round((size / Math.pow(1024, index)) * 100) / 100} ${units[index]};
}

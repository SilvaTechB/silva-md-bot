import { downloadContentFromMessage } from "@whiskeysockets/baileys"

let handler = m => m

handler.before = async function (msg, { conn }) {
  if (process.env.ANTIVIEWONCE !== "true") return

  try {
    if (!["viewOnceMessageV2", "viewOnceMessageV2Extension"].includes(msg.mtype)) return

    const viewOnceContent =
      msg.mtype === "viewOnceMessageV2"
        ? msg.message?.viewOnceMessageV2?.message
        : msg.message?.viewOnceMessageV2Extension?.message

    if (!viewOnceContent) return

    const mediaType = Object.keys(viewOnceContent).find(k =>
      ["imageMessage", "videoMessage", "audioMessage"].includes(k)
    )
    if (!mediaType) return

    const mediaMsg = viewOnceContent[mediaType]
    const downloadType = mediaType.replace("Message", "").toLowerCase()

    let mediaBuffer
    try {
      const stream = await downloadContentFromMessage(mediaMsg, downloadType)
      const chunks = []
      for await (const chunk of stream) {
        chunks.push(chunk)
      }
      mediaBuffer = Buffer.concat(chunks)
    } catch {
      return
    }

    if (!mediaBuffer || mediaBuffer.length === 0) return

    const fileSize = mediaMsg.fileLength
      ? formatFileSize(Number(mediaMsg.fileLength))
      : "Unknown"

    const caption = mediaMsg.caption ? `*Caption:* ${mediaMsg.caption}\n` : ""
    const senderNum = msg.sender?.split("@")[0] || "Unknown"

    const infoMessage = `*💀 SILVA MD ANTI VIEW ONCE 💀*\n*Type:* ${
      mediaType === "imageMessage" ? "Image 📸" : mediaType === "videoMessage" ? "Video 📹" : "Voice 🎤"
    }\n*Size:* ${fileSize}\n*User:* @${senderNum}\n${caption}`.trim()

    const mentions = msg.sender ? [msg.sender] : []

    if (mediaType === "imageMessage") {
      await conn.sendMessage(conn.user.id, {
        image: mediaBuffer,
        caption: infoMessage,
        mentions
      }, { quoted: msg })
    } else if (mediaType === "videoMessage") {
      await conn.sendMessage(conn.user.id, {
        video: mediaBuffer,
        caption: infoMessage,
        mentions
      }, { quoted: msg })
    } else if (mediaType === "audioMessage") {
      await conn.sendMessage(conn.user.id, {
        text: infoMessage,
        mentions
      }, { quoted: msg })
      await conn.sendMessage(conn.user.id, {
        audio: mediaBuffer,
        mimetype: "audio/mpeg",
        ptt: true
      }, { quoted: msg })
    }
  } catch (error) {
    console.error("[ANTIVIEWONCE]", error.message)
  }
}

export default handler

function formatFileSize(sizeInBytes) {
  if (!sizeInBytes || isNaN(sizeInBytes)) return "Unknown"
  const units = ["Bytes", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(sizeInBytes) / Math.log(1024))
  return `${(sizeInBytes / Math.pow(1024, i)).toFixed(2)} ${units[i] || "GB"}`
}

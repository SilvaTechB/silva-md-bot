const axios = require('axios');
const fs = require('fs');
const { getContentType } = require('@whiskeysockets/baileys');

const handler = {
  command: "tourl",
  alias: ["url", "makeurl"],
  react: "🔗",
  desc: "Convert image/video to a URL",
  category: "tools",

  execute: async ({ sock, message, botLogger }) => {
    try {
      const jid = message.key.remoteJid;
      const quoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage || message.message;
      const mime = quoted ? (getContentType(quoted) === 'imageMessage' ? 'image/jpeg' : (getContentType(quoted) === 'videoMessage' ? 'video/mp4' : null)) : null;

      if (!mime) {
        return sock.sendMessage(jid, { text: "❌ Please reply to an image or video to convert it to a URL." }, { quoted: message });
      }

      const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
      const stream = await downloadContentFromMessage(quoted[getContentType(quoted)], mime.split('/')[0]);
      let buffer = Buffer.from([]);
      for await (const chunk of stream) {
        buffer = Buffer.concat([buffer, chunk]);
      }

      // Using Catbox.moe for file hosting (fast and simple)
      const FormData = require('form-data');
      const form = new FormData();
      form.append('reqtype', 'fileupload');
      form.append('fileToUpload', buffer, { filename: `silva_${Date.now()}.${mime.split('/')[1]}` });

      const res = await axios.post('https://catbox.moe/user/api.php', form, {
        headers: { ...form.getHeaders() }
      });

      if (res.data) {
        await sock.sendMessage(jid, {
          text: `🔗 *SILVA URL CONVERTER*\n\n*URL:* ${res.data}\n\n*Expiry:* Permanent (Catbox)`
        }, { quoted: message });
      } else {
        throw new Error("Failed to upload to Catbox");
      }

    } catch (err) {
      botLogger.log('ERROR', "ToURL error: " + err.message);
      await sock.sendMessage(message.key.remoteJid, { text: "❌ Error: " + err.message }, { quoted: message });
    }
  }
};

module.exports = { handler };

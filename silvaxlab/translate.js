const axios = require('axios');

const handler = {
  command: "translate",
  alias: ["trt", "tl"],
  react: "🌍",
  desc: "Translate text to another language",
  category: "tools",

  execute: async ({ sock, message, args }) => {
    try {
      const jid = message.key.remoteJid;
      let targetLang = args[0];
      let text = args.slice(1).join(" ");

      // Check if quoted message exists
      const quoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
      if (quoted) {
        text = quoted.conversation || quoted.extendedTextMessage?.text || text;
        if (!targetLang) targetLang = "en"; // Default to English if replying
      }

      if (!text || !targetLang) {
        return sock.sendMessage(jid, { 
          text: "❌ Usage: `.translate <lang_code> <text>` or reply to a message with `.translate <lang_code>`\nExample: `.translate en Bonjour`" 
        }, { quoted: message });
      }

      const res = await axios.get(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`);
      const translation = res.data[0].map(x => x[0]).join("");

      await sock.sendMessage(jid, { 
        text: `🌍 *SILVA TRANSLATOR*\n\n*Target:* ${targetLang}\n\n*Result:* ${translation}` 
      }, { quoted: message });

    } catch (err) {
      await sock.sendMessage(message.key.remoteJid, { text: "❌ Translation failed. Check language code (e.g., en, es, fr, ar)." }, { quoted: message });
    }
  }
};

module.exports = { handler };

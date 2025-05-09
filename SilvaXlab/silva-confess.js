let handler = async (m, { conn, args, text, command }) => {
  if (!m.isGroup) return m.reply("❌ This command only works in groups.");

  if (!text) return m.reply(`📌 Use like this:\n.confess I have a crush on someone here...`);

  let reveal = false;
  let confession = text;

  if (text.includes("#reveal")) {
    reveal = true;
    confession = text.replace("#reveal", "").trim();
  }

  const senderId = m.sender.split("@")[0];
  const name = reveal ? `🙋‍♂️ *Confessed by:* @${senderId}` : "🙊 *Anonymous Confession*";
  const replyLink = `wa.me/${senderId}?text=Hey!%20I%20saw%20your%20confession%20in%20the%20group%20😊`;

  const msg = `┌───「 💌 *CONFESSION* 」───┐\n\n📩 *Message:*\n${confession}\n\n${name}\n\n🌐 [Reply privately](https://${replyLink})\n└──────────────────────────┘`;

  let sentMsg = await conn.sendMessage(m.chat, {
    text: msg,
    mentions: reveal ? [m.sender] : [],
    contextInfo: {
      mentionedJid: reveal ? [m.sender] : [],
      forwardingScore: 999,
      isForwarded: true,
      forwardedNewsletterMessageInfo: {
        newsletterJid: '120363200367779016@newsletter',
        newsletterName: 'SILVA MD CONFESSIONS 💌',
        serverMessageId: 143,
      },
      externalAdReply: {
        title: "SILVA CONFESSIONS 💖",
        body: "Tap to reply anonymously",
        thumbnailUrl: "https://i.imgur.com/RvEKtPJ.jpeg",
        sourceUrl: `https://${replyLink}`,
        mediaType: 1,
        renderLargerThumbnail: true,
      }
    }
  });

  // React to original message
  await conn.sendMessage(m.chat, {
    react: {
      text: "💌",
      key: m.key
    }
  });

  // Auto delete after 60 seconds
  setTimeout(async () => {
    await conn.sendMessage(m.chat, { delete: sentMsg.key });
  }, 60000);
};

handler.help = ["confess"];
handler.tags = ["fun"];
handler.command = ["confess"];
handler.group = true;

export default handler;

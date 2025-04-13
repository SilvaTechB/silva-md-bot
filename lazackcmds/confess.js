let handler = async (m, { conn, args, text, command, isGroup }) => {
  if (!isGroup) return m.reply("❌ This command only works in groups.");

  if (!text) return m.reply(`📌 Use like this:\n.confess I have a crush on someone here...`);

  let reveal = false;
  let confession = text;

  if (text.includes("#reveal")) {
    reveal = true;
    confession = text.replace("#reveal", "").trim();
  }

  const name = reveal ? `🙋‍♂️ *Confessed by:* @${m.sender.split("@")[0]}` : "🙊 *Anonymous Confession*";

  let msg = `╭────[ 🕵️ *CONFESSION* ]────╮\n\n📩 *Message:*\n${confession}\n\n${name}\n╰──────────────────────────╯`;

  await conn.sendMessage(m.chat, {
    text: msg,
    mentions: reveal ? [m.sender] : [],
    contextInfo: {
      mentionedJid: reveal ? [m.sender] : [],
      forwardingScore: 999,
      isForwarded: true,
      forwardedNewsletterMessageInfo: {
        newsletterJid: '120363200367779016@newsletter',
        newsletterName: 'SILVA MD CONFESSIONS 💌',
        serverMessageId: 143
      }
    }
  });

  await conn.sendMessage(m.chat, {
    react: {
      text: "💌",
      key: m.key
    }
  });
};

handler.help = ["confess"];
handler.tags = ["fun"];
handler.command = ["confess"];
handler.group = true;

export default handler;

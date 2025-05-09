let handler = async (m, { conn, text, command }) => {
  if (!text) {
    throw "⚠️ *Please enter the error you wish to report.*";
  }

  if (text.length < 10) {
    throw "⚠️ *Please describe the error in detail (at least 10 characters).*";
  }

  if (text.length > 1000) {
    throw "⚠️ *Maximum 1000 characters allowed for error reporting.*";
  }

  const sender = m.sender.split('@')[0];
  const reportMessage = 
`╭─⭓ *SILVA R E P O R T 📩*
│ 📱 *From:* wa.me/${sender}
│ 
│ 💬 *Message:*
│ ${text}
╰───────────────`;

  // Send report to the owner (replace with your number if different)
  await conn.reply("254700143167@s.whatsapp.net", m.quoted ? reportMessage + "\n\n📌 *Quoted Message:* " + m.quoted.text : reportMessage, m, {
    mentions: conn.parseMention(reportMessage)
  });

  await m.reply("✅ *Your report has been sent to the developer. False reports may lead to a ban.*");
};

handler.help = ["report"];
handler.tags = ["info"];
handler.command = ["report", "bug", "error"];

export default handler;

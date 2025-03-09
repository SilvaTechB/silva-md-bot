let isAway = false;
let lastSeen = new Date();

let handler = async (m, { conn, text, command }) => {
  if (command === "away") {
    isAway = true;
    lastSeen = new Date();
    return m.reply("✅ *Away Mode Activated!*\n\nI will auto-reply to messages until you type *active*.");
  }

  if (command === "active") {
    isAway = false;
    return m.reply("✅ *Away Mode Deactivated!*\n\nI am back online.");
  }

  if (isAway) {
    let now = new Date();
    let diff = now - lastSeen;

    let seconds = Math.floor(diff / 1000) % 60;
    let minutes = Math.floor(diff / (1000 * 60)) % 60;
    let hours = Math.floor(diff / (1000 * 60 * 60)) % 24;
    let days = Math.floor(diff / (1000 * 60 * 60 * 24));

    let lastSeenText = `*${days}d ${hours}h ${minutes}m ${seconds}s*`;

    return await conn.sendMessage(
      m.chat,
      {
        text: `🤖 *BIP BOP! THIS IS SILVA MD BOT*\n\n🚀 *MY OWNER IS AWAY!*\n📅 *Last Seen:* ${lastSeenText}`,
        contextInfo: {
          mentionedJid: [m.sender],
          forwardingScore: 999,
          isForwarded: true,
          forwardedNewsletterMessageInfo: {
            newsletterJid: "120363200367779016@newsletter",
            newsletterName: "SILVA IS AWAY 🥰🥰",
            serverMessageId: 143,
          },
        },
      },
      { quoted: m }
    );
  }
};

handler.help = ["away", "active"];
handler.tags = ["tools"];
handler.command = ["away", "active"];

export default handler;

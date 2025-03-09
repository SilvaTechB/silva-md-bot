let isAway = false;
let lastSeen = null;

let handler = async (m, { conn, command }) => {
  if (command === "away") {
    if (isAway) return m.reply("🚀 *Away Mode is already enabled!*");

    isAway = true;
    lastSeen = Date.now();
    return m.reply("✅ *Away Mode Activated!*\n\nI will auto-reply until you type *active*.");
  }

  if (command === "active") {
    if (!isAway) return m.reply("✅ *You are already active!*");

    isAway = false;
    return m.reply("✅ *Away Mode Deactivated!*\n\nI am back online.");
  }

  // If Away Mode is ON, notify the sender
  if (isAway) {
    let now = Date.now();
    let diff = now - lastSeen;

    let seconds = Math.floor(diff / 1000) % 60;
    let minutes = Math.floor(diff / (1000 * 60)) % 60;
    let hours = Math.floor(diff / (1000 * 60 * 60)) % 24;
    let days = Math.floor(diff / (1000 * 60 * 60 * 24));

    let lastSeenText = `*${days}d ${hours}h ${minutes}m ${seconds}s*`;

    await conn.sendMessage(
      m.chat,
      {
        text: `🤖 *BIP BOP! THIS IS SILVA MD BOT*\n\n🚀 *MY OWNER IS AWAY!*\n📅 *Last Seen:* ${lastSeenText}\n\nI will respond when my owner is back.`,
        contextInfo: {
          mentionedJid: [m.sender],
          forwardingScore: 999,
          isForwarded: true,
          forwardedNewsletterMessageInfo: {
            newsletterJid: "120363200367779016@newsletter",
            newsletterName: "SILVA IS AWAY 🥳",
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

let handler = async (m, { conn }) => {
  if (!m.isGroup) {
    return m.reply('❌ This command only works in groups.');
  }

  try {
    let groupMetadata = await conn.groupMetadata(m.chat);
    let participants = groupMetadata.participants.map(p => p.id);
    let onlineUsers = [];

    for (let user of participants) {
      try {
        const presence = await conn.presenceSubscribe(user);
        if (presence?.lastSeen && (Date.now() - presence.lastSeen < 5 * 60 * 1000)) { // 5 minutes active
          onlineUsers.push(user);
        }
      } catch (e) {
        // Ignore errors silently
      }
    }

    if (onlineUsers.length === 0) {
      return m.reply('🛜 Nobody is online right now.');
    }

    let list = onlineUsers.map(u => `@${u.split('@')[0]}`).join('\n');
    let message = `🛜 *Online Users:*\n\n${list}`;

    await conn.sendMessage(m.chat, {
      text: message,
      mentions: onlineUsers,
      contextInfo: {
        forwardingScore: 999,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
          newsletterJid: '120363200367779016@newsletter', // your newsletter JID
          newsletterName: '◢◤ Silva Md Bot ◢◤', // your bot's newsletter name
          serverMessageId: 143 // can be any random number
        }
      }
    });
  } catch (e) {
    console.error(e);
    m.reply('❌ Failed to fetch online users.');
  }
};

handler.help = ["listonline"];
handler.tags = ["group"];
handler.command = ["listonline", "online"];

module.exports = handler;

let handler = async (m, { conn }) => {
  if (!m.isGroup) {
    return m.reply('❌ This command only works in groups.');
  }

  try {
    let groupMetadata = await conn.groupMetadata(m.chat);
    let participants = groupMetadata.participants.map(p => p.id);
    let onlineUsers = [];

    for (let user of participants) {
      if ((conn.chats[m.chat]?.presences?.[user]?.lastKnownPresence || '').toLowerCase() === 'available') {
        onlineUsers.push(user);
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
          newsletterJid: '120363200367779016@newsletter',
          newsletterName: '◢◤ Silva Md Bot ◢◤',
          serverMessageId: 143
        }
      }
    });
  } catch (e) {
    console.error(e);
    m.reply('❌ Error fetching online users.');
  }
};

handler.help = ["listonline"];
handler.tags = ["group"];
handler.command = ["listonline", "online"];

module.exports = handler;

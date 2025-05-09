let handler = async (m, { conn }) => {
  if (!m.isGroup) throw '❌ This command only works in group chats!';

  let groupMetadata = await conn.groupMetadata(m.chat);
  let participants = groupMetadata.participants.map(p => p.id);
  
  let onlineUsers = participants.map(u => `@${u.split('@')[0]}`).join('\n');

  let text = `🛜 *Group Members Currently Available:*\n\n${onlineUsers}`;

  await conn.sendMessage(m.chat, {
    text,
    mentions: participants,
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
};

handler.help = ["listonline"];
handler.tags = ["group"];
handler.command = ["listonline", "online"];

module.exports = handler;

let spamData = {}

let handler = async (m, { conn }) => {
  try {
    if (!m.isGroup) return;
    if (m.isBaileys) return;

    const id = m.chat;
    const user = m.sender;
    const now = Date.now();

    spamData[id] = spamData[id] || {};
    spamData[id][user] = spamData[id][user] || { count: 0, lastTime: 0 };

    if (now - spamData[id][user].lastTime > 7000) {
      spamData[id][user].count = 0;
    }

    spamData[id][user].count++;
    spamData[id][user].lastTime = now;

    if (spamData[id][user].count >= 5) {
      spamData[id][user].count = 0;

      await conn.reply(m.chat, `🚨 *Anti-Spam Alert!*\n@${user.split('@')[0]} is spamming!`, m, {
        mentions: [user]
      });

      try {
        await conn.groupParticipantsUpdate(m.chat, [user], 'restrict');
      } catch (err) {
        console.error('❌ Failed to restrict user:', err.message);
        await conn.reply(m.chat, `❌ Failed to restrict user. Make sure I am an admin!`, m);
      }
    }
  } catch (error) {
    console.error(`❌ Anti-Spam Error: ${error.message}`);
  }
};

handler.all = handler;
export default handler;

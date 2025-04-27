let spamData = {};

let handler = async (m, { conn, isBotAdmin }) => {
  try {
    if (!m.isGroup) return;
    if (m.isBaileys) return;

    let id = m.chat;
    let user = m.sender;
    let now = Date.now();

    spamData[id] = spamData[id] || {};
    spamData[id][user] = spamData[id][user] || { count: 0, lastTime: 0 };

    if (now - spamData[id][user].lastTime > 7000) {
      spamData[id][user].count = 0;
    }

    spamData[id][user].count++;
    spamData[id][user].lastTime = now;

    if (spamData[id][user].count >= 5) {
      spamData[id][user].count = 0;

      await conn.sendMessage(m.chat, {
        text: `🚨 *Anti-Spam Alert!*\n@${user.split('@')[0]} is detected spamming the group!`,
        mentions: [user],
        contextInfo: {
          forwardingScore: 999,
          isForwarded: true,
          forwardedNewsletterMessageInfo: {
            newsletterJid: '120363200367779016@newsletter',
            newsletterName: '◢◤ Silva MD Bot ◢◤',
            serverMessageId: 143
          }
        }
      });

      // Send animated sticker after message
      await conn.sendMessage(m.chat, { 
        sticker: { url: "https://raw.githubusercontent.com/SilvaTechB/silva-md-bot/main/media/STK-20250425-WA0008.webp" }
      }, { quoted: m });

      // Try muting if bot is admin
      if (isBotAdmin) {
        try {
          await conn.groupParticipantsUpdate(m.chat, [user], 'restrict');
        } catch (err) {
          console.error('❌ Failed to restrict:', err);
          await conn.sendMessage(m.chat, { text: `⚠️ Error trying to mute user.` });
        }
      } else {
        await conn.sendMessage(m.chat, { text: `⚠️ I'm not an admin, cannot mute spammers!` });
      }
    }
  } catch (e) {
    console.error('Anti-spam error:', e);
  }
};

handler.all = handler;
export default handler;

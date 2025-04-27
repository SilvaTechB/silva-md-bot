let spamData = {};

let handler = async (m, { conn, participants }) => {
  try {
    if (!m.isGroup) return;
    if (m.isBaileys) return;

    const id = m.chat;
    const user = m.sender;
    const now = Date.now();

    // Initialize chat and user data
    spamData[id] = spamData[id] || {};
    spamData[id][user] = spamData[id][user] || { count: 0, lastTime: 0 };

    // Reset count if last message was more than 7 seconds ago
    if (now - spamData[id][user].lastTime > 7000) {
      spamData[id][user].count = 0;
    }

    // Update spam counter
    spamData[id][user].count++;
    spamData[id][user].lastTime = now;

    // Check spam threshold
    if (spamData[id][user].count >= 5) {
      spamData[id][user].count = 0; // Reset counter after triggering

      // Send warning message
      await conn.sendMessage(m.chat, {
        text: `🚨 *Anti-Spam Alert!*\n@${user.split('@')[0]} detected spamming. Muting...`,
        mentions: [user]
      });

      // Attempt to mute user
      try {
        await conn.groupParticipantsUpdate(m.chat, [user], 'restrict');
      } catch (muteError) {
        console.error('Mute error:', muteError);
        await conn.sendMessage(m.chat, {
          text: `❌ Failed to mute user. Ensure I'm an admin with proper permissions.`
        });
        return;
      }

      // Send confirmation sticker
      await conn.sendMessage(m.chat, { 
        sticker: { url: "https://raw.githubusercontent.com/SilvaTechB/silva-md-bot/main/media/STK-20250425-WA0008.webp" }
      }, { quoted: m });
    }
  } catch (error) {
    console.error('Anti-spam handler error:', error);
    // Optional: Notify admins about the error
    // await conn.sendMessage(m.chat, { text: `⚠️ An error occurred in anti-spam system: ${error.message}` });
  }
};

handler.all = handler;
export default handler;

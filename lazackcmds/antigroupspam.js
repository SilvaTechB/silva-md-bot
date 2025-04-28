let spamData = {};

let handler = async (m, { conn }) => {
  try {
    // Ensure it's a group and not a system message
    if (!m.isGroup) return;
    if (m.isBaileys) return;

    const id = m.chat; // Group ID
    const user = m.sender; // User ID of sender
    const now = Date.now();

    // Initialize spam data structure for the group and user
    spamData[id] = spamData[id] || {};
    spamData[id][user] = spamData[id][user] || { count: 0, lastTime: 0 };

    // Reset spam count if last message was sent > 7 seconds ago
    if (now - spamData[id][user].lastTime > 7000) {
      spamData[id][user].count = 0;
    }

    // Increment spam count and update the last message time
    spamData[id][user].count++;
    spamData[id][user].lastTime = now;

    // If spam count exceeds threshold, take action
    if (spamData[id][user].count >= 5) {
      spamData[id][user].count = 0; // Reset spam count after action

      // Notify group about spammer
      await conn.reply(
        m.chat,
        `🚨 *Anti-Spam Alert!*\n@${user.split('@')[0]} is spamming!`,
        m,
        { mentions: [user] }
      );

      // Attempt to restrict the user
      try {
        await conn.groupParticipantsUpdate(m.chat, [user], 'restrict');
      } catch (err) {
        console.error('❌ Failed to restrict user:', err.message);
        await conn.reply(
          m.chat,
          `❌ Failed to restrict user. Make sure I am an admin!`,
          m
        );
      }
    }
  } catch (error) {
    // Log error for debugging
    console.error(`❌ Anti-Spam Error: ${error.message}`);
  }
};

// Ensure the handler is called for all messages
handler.all = handler;

// Export the handler (default export)
export default handler;

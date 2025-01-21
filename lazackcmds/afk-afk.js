// Function to handle AFK status and respond to mentions/messages
export async function before(message) {
  try {
    if (!message || !message.sender) return; // Ensure the message is valid
    if (!global.db.data) global.db.data = { users: {} }; // Initialize database
    if (!global.db.data.users[message.sender]) {
      global.db.data.users[message.sender] = { afk: -1, afkReason: '' };
    }

    const user = global.db.data.users[message.sender];

    // Debugging log
    console.log('Message received:', message.text);
    console.log('User data:', user);

    // Command: Set AFK status
    if (message.text.toLowerCase().startsWith('afk ')) {
      const reason = message.text.slice(4).trim(); // Extract reason
      if (!reason) {
        await message.reply("❌ Please provide a reason after 'afk'. Example: 'afk I'm busy'.");
        return true;
      }
      user.afk = Date.now(); // Set AFK timestamp
      user.afkReason = reason; // Store reason
      await message.reply(`💤 You are now AFK with reason: ${reason}`);
      return true;
    }

    // Command: Deactivate AFK status
    if (message.text.toLowerCase() === 'active') {
      if (user.afk > -1) {
        const afkDuration = formatDuration(Date.now() - user.afk);
        await message.reply(`✅ You are no longer AFK! ▢ *AFK Duration:* ${afkDuration}`);
        user.afk = -1; // Reset AFK status
        user.afkReason = ''; // Clear reason
      } else {
        await message.reply("❌ You are not currently AFK.");
      }
      return true;
    }

    // Handle mentions and quoted messages
    const mentionedJids = [
      ...(message.mentionedJid || []),
      ...(message.quoted ? [message.quoted.sender] : []),
    ];

    for (let mentionedJid of mentionedJids) {
      const mentionedUser = global.db.data.users[mentionedJid];
      if (!mentionedUser || mentionedUser.afk < 0) continue; // Skip if not AFK

      const afkDuration = formatDuration(Date.now() - mentionedUser.afk);
      const reason = mentionedUser.afkReason || 'Without reason';

      await message.reply(`🛌 The user you mentioned is AFK:\n▢ *Reason:* ${reason}\n▢ *AFK Duration:* ${afkDuration}`);
    }

    // Notify in private chats if the recipient is AFK
    if (message.chat.endsWith('@s.whatsapp.net')) {
      const recipient = global.db.data.users[message.chat];
      if (recipient && recipient.afk > -1) {
        const afkDuration = formatDuration(Date.now() - recipient.afk);
        const reason = recipient.afkReason || 'Without reason';

        await message.reply(`💤 The user you are messaging is currently AFK:\n▢ *Reason:* ${reason}\n▢ *AFK Duration:* ${afkDuration}`);
      }
    }

  } catch (error) {
    console.error("Error in AFK script:", error);
  }
  return true; // Indicate successful processing
}

// Utility function to format duration into hh:mm:ss
function formatDuration(ms) {
  const seconds = Math.floor(ms / 1000) % 60;
  const minutes = Math.floor(ms / (1000 * 60)) % 60;
  const hours = Math.floor(ms / (1000 * 60 * 60));
  return [hours, minutes, seconds]
    .map((v) => v.toString().padStart(2, '0'))
    .join(':');
}

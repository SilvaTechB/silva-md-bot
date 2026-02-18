// Function to handle AFK status and respond to mentions/messages
export async function before(message) {
  const user = global.db.data.users[message.sender]; // Access user data

  // If the user types 'afk [reason]', set the user to AFK with a reason
  if (message.text.toLowerCase().startsWith('afk ')) {
    const reason = message.text.slice(4).trim(); // Extract the reason after "afk "
    
    if (reason) {
      user.afk = Date.now(); // Mark the time the user went AFK
      user.afkReason = reason; // Store the reason for being AFK
      await message.reply(`💤 You are now AFK with reason: ${reason}`);
    } else {
      await message.reply("❌ Please provide a reason after 'afk'. Example: 'afk I'm busy'.");
    }
    return true; // Exit after processing the 'afk' command
  }

  // If the user types 'active', deactivate AFK status
  if (message.text.toLowerCase() === 'active') {
    if (user.afk > -1) {
      const afkDuration = (new Date() - user.afk); // Calculate AFK duration
      const afkDurationString = new Date(afkDuration).toISOString().substr(11, 8); // Format to hh:mm:ss

      await message.reply(`✅ You are no longer AFK! ▢ *AFK Duration:* ${afkDurationString}`);
      user.afk = -1; // Reset AFK status
      user.afkReason = ''; // Clear the reason
    } else {
      await message.reply("❌ You are not currently AFK.");
    }
    return true; // Exit after processing the 'active' command
  }

  // Handle mentions, quoted messages, and private messages
  const mentionedJids = [
    ...(message.mentionedJid || []),
    ...(message.quoted ? [message.quoted.sender] : []),
  ];

  const isPrivateChat = message.chat.endsWith('@s.whatsapp.net'); // Check if it's a private chat

  for (let mentionedJid of mentionedJids) {
    const mentionedUser = global.db.data.users[mentionedJid];
    if (!mentionedUser || mentionedUser.afk < 0) continue; // Skip if the user is not AFK

    const afkDuration = (new Date() - mentionedUser.afk); // AFK duration
    const afkDurationString = new Date(afkDuration).toISOString().substr(11, 8); // Format to hh:mm:ss

    const reason = mentionedUser.afkReason || 'Without reason';

    // Notify others that the mentioned user is AFK
    await message.reply(`
      💤 The user you mentioned is AFK
      ▢ *Reason:* ${reason}
      ▢ *AFK Duration:* ${afkDurationString}
    `.trim());
  }

  // Notify the sender in private chats if the recipient is AFK
  if (isPrivateChat) {
    const recipient = global.db.data.users[message.chat];
    if (recipient && recipient.afk > -1) {
      const afkDuration = (new Date() - recipient.afk); // AFK duration
      const afkDurationString = new Date(afkDuration).toISOString().substr(11, 8); // Format to hh:mm:ss

      const reason = recipient.afkReason || 'Without reason';

      await message.reply(`
        💤 The user you are messaging is currently AFK
        ▢ *Reason:* ${reason}
        ▢ *AFK Duration:* ${afkDurationString}
      `.trim());
    }
  }

  return true; // Indicate successful processing
}

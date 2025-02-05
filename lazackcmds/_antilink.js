const linkRegex = /^https?:\/\/(www\.)?chat\.whatsapp\.com\/(?:invite\/)?([0-9A-Za-z]{20,24})/i;

export async function before(m, { conn, isAdmin, isBotAdmin }) {
  // Ignore messages from the bot itself
  if (m.fromMe) return true;
  // Only process group messages
  if (!m.isGroup) return false;

  // Initialize chat data with fallback
  const chat = global.db.data.chats[m.chat] || { antiLink: false };
  const botSettings = global.db.data.settings[conn.user.jid] || {};
  
  // Check for group links in message text
  const hasGroupLink = m.text ? linkRegex.test(m.text.trim()) : false;

  if (chat.antiLink && hasGroupLink && !isAdmin) {
    try {
      // Get current group's invite code
      const groupInvite = await conn.groupInviteCode(m.chat).catch(() => null);
      const groupLink = `https://chat.whatsapp.com/${groupInvite}`;

      // Allow the group's own link
      if (groupInvite && m.text.includes(groupLink)) return true;

      // Prepare anti-link action
      const deleteMsg = isBotAdmin ? await conn.sendMessage(m.chat, { delete: m.key }) : null;
      const removeUser = isBotAdmin ? 
        await conn.groupParticipantsUpdate(m.chat, [m.sender], 'remove') : 
        null;

      // Send warning message with mention
      const warningMsg = `*≡ Link Detected*\n\n` +
        `Group links are not allowed!\n` +
        `@${m.sender.split('@')[0]} has been ${isBotAdmin ? 'removed' : 'reported'}` +
        `${isBotAdmin ? '' : '\n\nBot needs admin rights to remove users'}`;

      await conn.sendMessage(
        m.chat,
        { 
          text: warningMsg,
          mentions: [m.sender]
        },
        { quoted: m }
      );

      // Add optional cooldown
      if (botSettings.antiLinkCooldown) {
        chat.lastAntiLinkAction = Date.now();
      }

    } catch (error) {
      console.error('Anti-link error:', error);
      await conn.sendMessage(
        m.chat,
        { text: `❌ Error processing anti-link rule: ${error.message}` },
        { quoted: m }
      );
    }
    return true; // Block the original message
  }
  return false; // Don't block the message
}

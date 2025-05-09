export async function before(m, { conn }) {
  const ownerID = 'owner@s.whatsapp.net'; // Replace with the actual owner ID
  const specialUsers = [
    '254700143167@s.whatsapp.net',
    '254743706010@s.whatsapp.net',
    '254755257907@s.whatsapp.net',
  ]; // List of users for automatic reactions

  // Check if the message is in a group
  if (!m.isGroup) return;

  // Check if the owner is mentioned in the group
  if (m.mentionedJid?.includes(ownerID)) {
    try {
      // Reply to the mention with a custom message
      const replyMessage = `Hello! You mentioned the owner. How can I assist you?`;
      await conn.reply(m.chat, replyMessage, m, { mentions: [m.sender] });

      // React to the message with a specified emoji
      await conn.sendMessage(m.chat, {
        react: {
          text: '💖', // Reaction emoji for owner mention
          key: m.key,
        },
      });
    } catch (e) {
      console.error("Error handling owner mention:", e);
    }
  }

  // Automatically react to messages from specific users with 🥰 emoji
  if (specialUsers.includes(m.sender)) {
    try {
      await conn.sendMessage(m.chat, {
        react: {
          text: '🦋', // Reaction emoji for special users
          key: m.key,
        },
      });
    } catch (e) {
      console.error("Error sending reaction for special users:", e);
    }
  }
}

// Command settings (no command needed as this is auto-triggered)
export const disabled = false;

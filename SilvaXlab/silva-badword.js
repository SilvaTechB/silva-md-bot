// 💬 Silva MD Bad Word Filter – Auto Warning & Delete (if admin)

const badWordsList = ["dick", "fuck", "pussy", "sex"]; // Add more as needed

const handler = async (m, { conn, isAdmin, isBotAdmin, participants }) => {
  if (!m.isGroup || !m.text) return;

  const messageContent = m.text.toLowerCase();
  const badWordsFound = badWordsList.filter(word => messageContent.includes(word));

  if (badWordsFound.length > 0) {
    const senderMention = `@${m.sender.split("@")[0]}`;
    const warningMessage = `🚫 *Inappropriate Language Detected!*\n\n${senderMention}, please avoid using words like:\n*${badWordsFound.join(", ")}*\n\nMaintain a respectful group environment.\n\n_Powered by Silva Tech Inc._`;

    // Warn and delete if bot is admin
    if (isBotAdmin) {
      await conn.sendMessage(m.chat, {
        text: warningMessage,
        mentions: [m.sender],
        contextInfo: {
          forwardingScore: 999,
          isForwarded: true,
          forwardedNewsletterMessageInfo: {
            newsletterJid: '120363200367779016@newsletter',
            newsletterName: 'Silva MD Bot • Language Filter',
            serverMessageId: 154
          }
        }
      });

      try {
        await conn.sendMessage(m.chat, { delete: m.key }); // Delete offending message
      } catch (err) {
        console.error("❌ Failed to delete message:", err);
      }
    } else {
      // Just warn if bot isn’t admin
      await conn.reply(m.chat, warningMessage, m, { mentions: [m.sender] });
    }
  }
};

// Run for every group message
handler.before = true;
handler.group = true;

export default handler;
// Export the handler
export { handler as badwordHandler };
// This code is designed to be used in a WhatsApp bot environment.
// Make sure to adapt the imports and exports according to your project structure.
// The above code is a simple implementation of a bad word filter for WhatsApp groups.
// It checks messages for bad words and sends a warning to the user if any are found.
// If the bot is an admin, it also deletes the offending message.
// You can customize the list of bad words and the warning message as needed.
// Make sure to test the code in a safe environment before deploying it to a live group.
// Always respect user privacy and group rules when implementing such features.
// This code is provided as-is and should be used responsibly.
// Happy coding! 😊
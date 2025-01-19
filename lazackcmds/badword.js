const badWordsList = [
  "dick",
  "fuck",
  "pussy",
  "sex"
]; // Add more words as needed

const handler = async (m, { conn, isAdmin, isBotAdmin, text, participants }) => {
  // Ensure the message contains text
  if (!text) return;

  // Convert the message content to lowercase and check for bad words
  const messageContent = text.toLowerCase();
  const badWordsFound = badWordsList.filter((word) =>
    messageContent.includes(word)
  );

  if (badWordsFound.length > 0) {
    // Construct the warning message
    const warningMessage = `⚠️ *Avoid Bad Language* ⚠️\n\nHey @${
      m.sender.split("@")[0]
    }, please avoid using inappropriate words like:\n*${badWordsFound.join(", ")}*\n\nMaintain a respectful environment.\n\n*Powered by Silva Tech Inc.*`;

    // If in a group and the bot has admin privileges, delete the offending message
    if (m.isGroup && isBotAdmin) {
      await conn.sendMessage(m.chat, { text: warningMessage, mentions: [m.sender] });
      try {
        await conn.groupParticipantsUpdate(m.chat, [m.sender], "remove");
      } catch (error) {
        console.error("Error deleting message:", error.message);
      }
    } else {
      // Reply to the sender if not in a group or bot lacks admin privileges
      await conn.reply(m.chat, warningMessage, m, { mentions: [m.sender] });
    }
  }
};

handler.customPrefix = /.*/; // Matches all messages
handler.command = new RegExp; // Run for all messages

module.exports = handler;

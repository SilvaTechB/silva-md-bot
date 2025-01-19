const badWordsList = [
  "dick",
  "fuck",
  "pussy",
  "sex"
]; // Add more words as needed

const handler = async (m, { conn, text }) => {
  // Ensure the message has text content
  if (!text) return;

  // Convert the message content to lowercase and filter bad words
  const messageContent = text.toLowerCase();
  const badWordsFound = badWordsList.filter((word) =>
    messageContent.includes(word)
  );

  // If any bad words are found, reply with a warning
  if (badWordsFound.length > 0) {
    const warningMessage = `⚠️ *Avoid Bad Language* ⚠️\n\nHey @${
      m.sender.split("@")[0]
    }, please avoid using inappropriate words like:\n*${badWordsFound.join(", ")}*\n\nUse appropriate words to maintain a respectful environment.\n\n*Powered by Silva Tech Inc.*`;

    // Reply with the warning message
    try {
      await conn.reply(m.chat, warningMessage, m, {
        mentions: [m.sender],
      });
    } catch (error) {
      console.error("Error sending reply:", error.message);
    }
  }
};

handler.help = ["badwords"];
handler.tags = ["moderation"];
handler.command = /^(.*)$/i; // Match any message

handler.admin = false; // Applies to everyone
handler.group = true;  // Enable in groups
handler.private = true; // Enable in private chats

module.exports = handler;

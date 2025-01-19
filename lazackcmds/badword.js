const badWordsList = [
  "dick", 
  "fuck", 
  "pussy", 
  "sex"
]; // Add more words as needed

const handler = async (m, { conn, text }) => {
  if (!text) return; // Ignore messages without text

  const messageContent = text.toLowerCase(); 
  const badWordsFound = badWordsList.filter((word) => messageContent.includes(word));
  
  if (badWordsFound.length > 0) {
    await conn.reply(
      m.chat,
      `⚠️ *Avoid Bad Language* ⚠️\n\nHey @${
        m.sender.split("@")[0]
      }, please avoid using inappropriate words like:\n*${badWordsFound.join(", ")}*\n\nUse appropriate words to maintain a respectful environment.\n\n*Powered by Silva Tech Inc.*`,
      m,
      {
        mentions: [m.sender],
      }
    );
  }
};

handler.help = ["badwords"];
handler.tags = ["moderation"];
handler.command = /^(.*)$/i; // Match any message

handler.admin = false; // Applies to everyone, not just admins
handler.group = true;  // Enable in groups
handler.private = true; // Enable in private chats

module.exports = handler;

let handler = async (message, { conn, text }) => {
  // Decoded strings to display credits and support
  const developedBy = "Developed by";
  const creatorName = "Silva The";
  const creatorTitle = "Techie (Silva Devs) 🧑‍💻";
  const support = "Support:";
  const supportLink = "https://www.google.com/search?q=SilvaTechB";

  // Combine the decoded strings into a single message
  let footerMessage = `${developedBy} ${creatorName} ${creatorTitle}\n${support} ${supportLink}`;

  // Get the sender's ID
  let senderId = message.sender;

  // Check if the user has an ex-lover
  if (global.db.data.users[senderId].exlover === '') {
    // If the user has no ex-lover, send this message
    conn.reply(
      message.chat,
      `*Silva says: You have no ex-relationships.*\n\n${footerMessage}`,
      message
    );
  } else {
    // If the user has an ex-lover, retrieve their details
    let exLoverId = global.db.data.users[senderId].exlover;
    let exLoverName = global.db.data.users[exLoverId].name;

    // Send a message mentioning the ex-lover
    conn.reply(
      message.chat,
      `*${exLoverName} is your ex-lover 🙂💔*\n\n${footerMessage}`,
      message,
      { mentions: [exLoverId] }
    );
  }
};

// Metadata for the bot command
handler.help = ["myex"]; // Help text for the command
handler.tags = ["relation"]; // Categorized under "relation"
handler.command = /^(myex)$/i; // Command trigger (case insensitive)
handler.couple = true; // Indicates it's related to relationships
handler.register = true; // Requires user to be registered in the bot's database

export default handler;

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

  // Check if the user has a lover
  if (global.db.data.users[senderId].lover === '') {
    // If the user has no lover, send this message
    conn.reply(
      message.chat,
      `*Silva says: You have no partner and are not loving anyone.*\n*Type /propose @user to propose to someone.*\n\n${footerMessage}`,
      message
    );
  } else {
    // Check if the lover's "lover" is not the sender (one-sided crush)
    if (global.db.data.users[global.db.data.users[senderId].lover].lover !== senderId) {
      let crushId = global.db.data.users[senderId].lover;
      let crushName = global.db.data.users[crushId].name;

      // If it's a crush, send this message
      conn.reply(
        message.chat,
        `*Silva says: You are crushing on ${crushName} 💖🥰*\n*Type #uncrush @tag to remove them from your crush list.*\n\n${footerMessage}`,
        message,
        { mentions: [crushId] }
      );
    } else {
      // If they are in a mutual relationship
      let partnerId = global.db.data.users[senderId].lover;
      let partnerName = global.db.data.users[partnerId].name;

      conn.reply(
        message.chat,
        `*Silva says: You are in a relationship with ${partnerName} 🥰☺️*\n\n${footerMessage}`,
        message,
        { mentions: [partnerId] }
      );
    }
  }
};

// Metadata for the bot command
handler.help = ["mylife"];
handler.tags = ["relation"];
handler.command = /^(mylife)$/i; // Command trigger (case insensitive)
handler.couple = true; // Indicates it's a relationship-related command
handler.register = true; // Requires user to be registered in the bot's database

export default handler;

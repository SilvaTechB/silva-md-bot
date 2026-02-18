let handler = async (message, { conn, text, usedPrefix }) => {
  const credits = "Developed by Silva The Techie (Silva Devs) 🌟";
  const support = "Support: https://www.google.com/search?q=SilvaTechB";

  // Extract user mention or number from the command
  let targetNumber = text ? text.split("@")[1] : null;

  if (!targetNumber && !message.quoted) {
    return conn.reply(
      message.chat,
      `You haven't mentioned anyone ❌. Tag a person you want to propose to. 😊\n\n${credits}\n${support}`,
      message
    );
  }

  if (isNaN(targetNumber)) {
    return conn.reply(
      message.chat,
      `The number you entered is invalid 🌎.\n\n${credits}\n${support}`,
      message
    );
  }

  if (targetNumber.length > 15) {
    return conn.reply(
      message.chat,
      `The number format is invalid ❌.\n\n${credits}\n${support}`,
      message
    );
  }

  let proposer = message.sender;
  let targetJid = targetNumber ? `${targetNumber}@s.whatsapp.net` : null;

  if (!targetJid && message.quoted) {
    targetJid = message.quoted.sender;
  }

  if (!targetJid) {
    return conn.reply(
      message.chat,
      `Target person not found ❌. They may have left the group or are not a member 👀.\n\n${credits}\n${support}`,
      message
    );
  }

  if (targetJid === message.sender) {
    return conn.reply(
      message.chat,
      `You can't propose to yourself 💖😀.\n\n${credits}\n${support}`,
      message
    );
  }

  if (targetJid === conn.user.jid) {
    return conn.reply(
      message.chat,
      `You can't propose to me as I'm just a WhatsApp AI 🤖.\n\n${credits}\n${support}`,
      message
    );
  }

  if (!global.db.data.users[targetJid]) {
    return conn.reply(
      message.chat,
      `The person you're proposing to is not registered in the bot. 💯😳\n\n${credits}\n${support}`,
      message
    );
  }

  let targetLover = global.db.data.users[targetJid].lover || '';
  let proposerLover = global.db.data.users[message.sender].lover || '';

  if (proposerLover && global.db.data.users[proposerLover].lover === message.sender) {
    return conn.reply(
      message.chat,
      `You are already in a relationship with @${proposerLover.split('@')[0]}. Be loyal and cherish them ❤️.\n\n${credits}\n${support}`,
      message,
      { mentions: [proposerLover] }
    );
  }

  if (targetLover) {
    let targetPartner = global.db.data.users[targetLover].name || "their partner";
    return conn.reply(
      message.chat,
      `Sorry, @${targetJid.split('@')[0]} is already in a relationship with ${targetPartner}. Don't be the third wheel! 😔.\n\n${credits}\n${support}`,
      message,
      { mentions: [targetJid, targetLover] }
    );
  }

  global.db.data.users[message.sender].lover = targetJid;
  conn.reply(
    message.chat,
    `Hey, @${targetJid.split('@')[0]}! You have been proposed to by @${message.sender.split('@')[0]} ❤️. Type '${usedPrefix}accept @user' or '${usedPrefix}reject @user' to respond.\n\n${credits}\n${support}`,
    message,
    { mentions: [targetJid, message.sender] }
  );
};

handler.help = ["propose"].map(cmd => `${cmd} *@tag*`);
handler.tags = ["relationship"];
handler.command = /^(propose)$/i;
handler.group = true;
handler.register = true;

export default handler;

let handler = async (message, { conn, text }) => {
  // Developer credits and support information
  const credits = "Developed by Silva The Techie (Silva Devs) 🌟";
  const supportLink = "Support: https://www.google.com/search?q=SilvaTechB";
  const footer = `${credits}\n${supportLink}`;

  // Extract target number or mention from the text
  let targetNumber = isNaN(text) ? text.split("@")[1] : text;

  // Validate input
  if (!text && !message.quoted) {
    return conn.reply(
      message.chat,
      `You haven't mentioned anyone ❌. Tag a person whose proposal you want to reject 🙂\n\n${footer}`,
      message
    );
  }

  if (isNaN(targetNumber)) {
    return conn.reply(
      message.chat,
      `The number you entered is not valid 🌎.\n\n${footer}`,
      message
    );
  }

  if (targetNumber.length > 15) {
    return conn.reply(
      message.chat,
      `The number format is not valid ❌.\n\n${footer}`,
      message
    );
  }

  let targetJid;

  try {
    // Determine the target WhatsApp ID
    if (text) {
      targetJid = `${targetNumber}@s.whatsapp.net`;
    } else if (message.quoted?.sender) {
      targetJid = message.quoted.sender;
    } else if (message.mentions) {
      targetJid = `${targetNumber}@s.whatsapp.net`;
    }
  } catch (error) {
    // No valid target found
  } finally {
    if (!targetJid) {
      return conn.reply(
        message.chat,
        `Target person not found ❌. They may have left the group or are not a member 👀.\n\n${footer}`,
        message
      );
    }

    if (targetJid === message.sender) {
      return conn.reply(
        message.chat,
        `You can't reject yourself 💖😀.\n\n${footer}`,
        message
      );
    }

    if (targetJid === conn.user.jid) {
      return conn.reply(
        message.chat,
        `You can't reject me as I'm just a WhatsApp AI 🤖.\n\n${footer}`,
        message
      );
    }

    // Check relationship status
    if (global.db.data.users[targetJid].lover !== message.sender) {
      let currentLover = global.db.data.users[targetJid].lover;
      let partnerName = global.db.data.users[currentLover]?.name || "someone else";
      return conn.reply(
        message.chat,
        `${partnerName} is not in a relationship with you. How can you reject them? 😂.\n\n${footer}`,
        message,
        { mentions: [targetJid] }
      );
    } else {
      // Reject and remove relationship
      let currentLover = global.db.data.users[targetJid].lover;
      let partnerName = global.db.data.users[currentLover]?.name || "someone";
      global.db.data.users[targetJid].lover = '';
      return conn.reply(
        message.chat,
        `Successfully rejected ${partnerName} and removed them from your heart 🙂💔.\n\n${footer}`,
        message,
        { mentions: [targetJid] }
      );
    }
  }
};

handler.help = ["reject *@tag*"];
handler.tags = ["relation"];
handler.command = /^(reject)$/i;
handler.group = true;

export default handler;

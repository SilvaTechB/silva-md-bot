const { generateWAMessageFromContent, proto } = require("@whiskeysockets/baileys");

let handler = async (m, { conn, usedPrefix, command, participants }) => {
  let user;

  // If it's a group and someone is mentioned, fetch their profile
  if (m.isGroup && m.mentionedJid && m.mentionedJid.length > 0) {
    user = m.mentionedJid[0];
  } else {
    // Else default to the sender (private chat or no mention)
    user = m.sender;
  }

  try {
    // Fetch profile picture
    let pp = await conn.profilePictureUrl(user, "image").catch(() => null);

    // Fetch display name
    let name = await conn.getName(user);

    // Fetch status/bio
    let about = await conn.fetchStatus(user).then(res => res.status).catch(() => "No bio found.");

    let caption = `👤 *Profile Info*\n\n🔖 *Name:* ${name}\n🆔 *JID:* ${user}\n🗒️ *Bio:* ${about}`;

    if (pp) {
      await conn.sendFile(m.chat, pp, "profile.jpg", caption, m, false, {
        mentions: [user],
      });
    } else {
      await m.reply(`${caption}\n\n⚠️ Profile picture not available.`);
    }
  } catch (err) {
    console.error(err);
    await m.reply("❌ Could not fetch the profile info. They may not have a profile photo or you may not have permission.");
  }
};

handler.help = ["getpp [@user]"];
handler.tags = ["tools"];
handler.command = ["getpp", "pp", "profilepic"];
handler.group = true;
handler.private = true;

module.exports = handler;

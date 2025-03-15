let handler = async (m, { text, conn }) => {
    let user = global.db.data.users[m.sender];

    // Define mssg if it's missing (replace with actual messages)
    let mssg = {
        afktemx: "Your AFK message is too long!",
        afkdone: "You are now AFK!",
        name: "User",
        with: "Reason",
        afkmsg: "I'll be back soon!"
    };

    if (text.length >= 90) throw `✳️ ${mssg.afktemx}`;

    user.afk = +new Date();
    user.afkReason = text || "No reason provided";

    m.reply(`
≡ *${mssg.afkdone}*

▢ *${mssg.name}:* ${conn.getName(m.sender)}
▢ *${mssg.with}:* ${text ? text : "No reason given"}

_${mssg.afkmsg}_
  `, null, { mentions: conn.parseMention(text) });
};

handler.help = ['afk'];
handler.tags = ['fun'];
handler.command = ['afk'];
handler.group = false;

export default handler;

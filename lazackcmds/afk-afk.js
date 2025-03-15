let handler = async (m, { text, conn }) => {
    let user = global.db.data.users[m.sender];

    // Define messages if mssg is not globally available
    let mssg = {
        afktemx: "Your AFK message is too long!",
        afkdone: "You are now AFK!",
        afkdisabled: "You are no longer AFK!",
        name: "User",
        with: "Reason",
        afkmsg: "I'll be back soon!"
    };

    // Check if user was AFK and deactivate
    if (user.afk) {
        let afkTime = (new Date() - user.afk) / 1000; // Convert to seconds
        let afkReason = user.afkReason || "No reason given";

        m.reply(`
🌟 *${mssg.afkdisabled}*
▢ *${mssg.name}:* ${conn.getName(m.sender)}
▢ *AFK Duration:* ${afkTime.toFixed(1)} seconds
▢ *Previous Reason:* ${afkReason}
        `);

        // Remove AFK status
        user.afk = null;
        user.afkReason = null;
    }

    // If user is trying to activate AFK
    if (text) {
        if (text.length >= 90) throw `✳️ ${mssg.afktemx}`;
        user.afk = +new Date();
        user.afkReason = text;

        m.reply(`
≡ *${mssg.afkdone}*

▢ *${mssg.name}:* ${conn.getName(m.sender)}
▢ *${mssg.with}:* ${text ? text : "No reason given"}

_${mssg.afkmsg}_
      `, null, { mentions: conn.parseMention(text) });
    }
};

handler.help = ['afk'];
handler.tags = ['fun'];
handler.command = ['afk'];
handler.group = false;

export default handler;

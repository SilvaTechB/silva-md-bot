let handler = async (m, { text, conn }) => {
    let user = global.db.data.users[m.sender];
    
    // Define messages if mssg is not globally available
    let mssg = {
        afktemx: "Your AFK message is too long!",
        afkdone: "Bip Bop! Silva MD Bot is AFK!",
        afkdisabled: "Silva MD Bot is now active!",
        name: "User",
        with: "Reason",
        afkmsg: "I'll be back soon!"
    };

    // If the owner types "active", disable AFK
    if (text.toLowerCase() === "active" && m.sender === global.owner[0]) {
        if (user.afk) {
            let afkTime = (new Date() - user.afk) / 1000; // Convert to seconds
            let duration = formatDuration(afkTime); // Convert to readable format
            let afkReason = user.afkReason || "No reason given";

            m.reply(`
🌟 *${mssg.afkdisabled}*
▢ *${mssg.name}:* ${conn.getName(m.sender)}
▢ *AFK Duration:* ${duration}
▢ *Previous Reason:* ${afkReason}
            `);

            // Remove AFK status
            user.afk = null;
            user.afkReason = null;
        }
        return;
    }

    // If AFK is active, notify every sender
    if (global.db.data.users[global.owner[0]].afk) {
        let afkUser = global.db.data.users[global.owner[0]];
        let afkDuration = formatDuration((new Date() - afkUser.afk) / 1000);
        let afkReason = afkUser.afkReason || "No reason given";

        m.reply(`
🚀 *Bip Bop! Silva MD Bot is AFK!*
▢ *AFK Since:* ${afkDuration}
▢ *Reason:* ${afkReason}
        `);
    }

    // If the owner types .afk <reason>, enable AFK mode
    if (text) {
        if (text.length >= 90) throw `✳️ ${mssg.afktemx}`;
        if (m.sender === global.owner[0]) {
            user.afk = +new Date();
            user.afkReason = text;

            m.reply(`
≡ *${mssg.afkdone}*

▢ *${mssg.name}:* ${conn.getName(m.sender)}
▢ *${mssg.with}:* ${text}

_${mssg.afkmsg}_

📢 Bip Bop! Silva MD Bot is AFK!
        `, null, { mentions: conn.parseMention(text) });
        }
    }
};

// Helper function to format duration into readable format
function formatDuration(seconds) {
    let hours = Math.floor(seconds / 3600);
    let minutes = Math.floor((seconds % 3600) / 60);
    let secs = Math.floor(seconds % 60);
    
    let result = [];
    if (hours) result.push(`${hours}h`);
    if (minutes) result.push(`${minutes}m`);
    if (secs) result.push(`${secs}s`);
    
    return result.join(" ") || "0s";
}

handler.help = ['afk'];
handler.tags = ['fun'];
handler.command = ['afk'];
handler.group = false;

export default handler;

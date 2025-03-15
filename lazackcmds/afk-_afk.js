export function before(m) {
    let user = global.db.data.users[m.sender];
    if (!user) return;

    // Define mssg if not globally available
    let mssg = {
        afkdel: "Welcome back! Your AFK status has been removed.",
        afktag: "This user is currently AFK.",
        name: "User",
        with: "Reason",
        afktime: "AFK Duration"
    };

    // If the sender was AFK, remove AFK mode and notify
    if (user.afk > -1) {
        let afkDuration = formatDuration(new Date() - user.afk);
        
        m.reply(`
${mssg.afkdel}

▢ *${mssg.name}:* ${this.getName(m.sender)}
▢ *${mssg.afktime}:* ${afkDuration}
        `.trim());

        user.afk = -1;
        user.afkReason = "";
    }

    // Check if mentioned users are AFK
    let mentionedUsers = [...new Set([...(m.mentionedJid || []), ...(m.quoted ? [m.quoted.sender] : [])])];

    for (let jid of mentionedUsers) {
        let afkUser = global.db.data.users[jid];
        if (!afkUser || afkUser.afk < 0) continue;

        let afkDuration = formatDuration(new Date() - afkUser.afk);
        let reason = afkUser.afkReason || "No reason provided";

        let afkMessage = `
≡ ${mssg.afktag}

▢ *${mssg.name}:* ${this.getName(jid)}
${reason ? `▢ *${mssg.with}:* ${reason}` : ""}
▢ *${mssg.afktime}:* ${afkDuration}
        `.trim();

        m.reply(afkMessage, null, { mentions: this.parseMention(afkMessage) });
    }
    return true;
}

// Helper function to format AFK duration (hh:mm:ss)
function formatDuration(ms) {
    let seconds = Math.floor(ms / 1000);
    let hours = Math.floor(seconds / 3600);
    let minutes = Math.floor((seconds % 3600) / 60);
    let secs = seconds % 60;

    return `${hours ? hours + "h " : ""}${minutes ? minutes + "m " : ""}${secs}s`;
}

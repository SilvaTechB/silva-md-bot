let handler = async (message, { conn, text, usedPrefix, command, args }) => {
    // Check if there are arguments
    if (!args.length) {
        throw `Usage: ${usedPrefix + command} <targetJid1,targetJid2,...> [text]`;
    }

    // Split the arguments into JIDs and message parts
    let [targetJids, ...messageParts] = args;
    const messageText = messageParts.join(" ").trim();

    // Check if the target JIDs are provided
    if (!targetJids) {
        throw `Please specify at least one target JID: ${usedPrefix + command} <targetJid1,targetJid2,...>`;
    }

    // Prepare the list of target JIDs
    let targetJidArray = targetJids.split(",").map(jid => 
        jid.includes("@") ? jid : jid + "@s.whatsapp.net"
    );

    // Limit to a maximum of 5000 targets
    if (targetJidArray.length > 5000) {
        throw "You can only send messages to a maximum of 5000 targets at once.";
    }

    // Ensure there is a quoted message
    if (!message.quoted) {
        throw `You must tag a message to send. Usage: ${usedPrefix + command} <targetJid1,targetJid2,...> [text]`;
    }

    // Send the tagged (quoted) message to each JID individually
    for (let target of targetJidArray) {
        try {
            // Forward the quoted message directly to each target without any forwarding indication
            await conn.sendMessage(target, { text: messageText }, { quoted: message.quoted });
        } catch (error) {
            // Notify the user if there is an issue sending to any JID
            await message.reply(`Failed to send message to ${target}: ${error.message}`);
        }
    }
};

// Command metadata
handler.help = ["sendtagged <targetJid1,targetJid2,...> [<text>]"];
handler.tags = ["tools"];
handler.command = /^(sendtagged)$/i;

export default handler;

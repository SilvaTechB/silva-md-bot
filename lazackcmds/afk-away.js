import fetch from "node-fetch";

// Store Away state and reason
let awayState = {
    isAway: false,
    reason: '',
    notifiedUsers: new Set(), // Track notified users to avoid spamming
};

// Command to activate Away mode
export async function handleAwayCommand(conn, message, reason) {
    awayState.isAway = true;
    awayState.reason = reason || 'I am currently away.';
    awayState.notifiedUsers.clear(); // Clear previously notified users

    await conn.sendMessage(message.key.remoteJid, { text: `Away mode activated. Reason: ${awayState.reason}` });
}

// Command to deactivate Away mode
export async function handleActiveCommand(conn, message) {
    awayState.isAway = false;
    awayState.reason = '';
    awayState.notifiedUsers.clear();

    await conn.sendMessage(message.key.remoteJid, { text: 'Away mode deactivated. Welcome back!' });
}

// Handle incoming messages
export async function handleIncomingMessage(conn, message) {
    const senderId = message.key.remoteJid;
    const isPrivateChat = !senderId.endsWith('@g.us');

    if (awayState.isAway && isPrivateChat && !awayState.notifiedUsers.has(senderId)) {
        // Notify the sender if Away
        const replyMessage = `I am currently away: ${awayState.reason}`;
        await conn.sendMessage(senderId, { text: replyMessage });
        awayState.notifiedUsers.add(senderId);
    }
}

// Command parser and execution
export async function onCommand(conn, message) {
    try {
        const text = message.message?.conversation || '';
        const args = text.split(' ');
        const command = args[0].toLowerCase();

        if (command === 'away') {
            const reason = args.slice(1).join(' ');
            await handleAwayCommand(conn, message, reason);
        } else if (command === 'active') {
            await handleActiveCommand(conn, message);
        }
    } catch (error) {
        console.error("Error processing command:", error);
        await conn.sendMessage(message.key.remoteJid, { text: "An error occurred while processing your command." });
    }
}

// Handler metadata
const handler = {
    help: ["away", "active"],
    tags: ["utility"],
    command: ["away", "active"],
};

export default {
    handleAwayCommand,
    handleActiveCommand,
    handleIncomingMessage,
    onCommand,
    handler,
};

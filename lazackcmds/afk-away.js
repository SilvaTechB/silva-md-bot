const { MessageType } = require('@whiskeysockets/baileys');

// Store Away state and reason
let awayState = {
    isAway: false,
    reason: '',
    notifiedUsers: new Set(), // Track notified users to avoid spamming
};

// Command to activate Away mode
async function handleAwayCommand(sock, chatId, reason) {
    awayState.isAway = true;
    awayState.reason = reason || 'I am currently away.';
    awayState.notifiedUsers.clear(); // Clear previously notified users

    await sock.sendMessage(chatId, { text: `Away mode activated. Reason: ${awayState.reason}` });
}

// Command to deactivate Away mode
async function handleActiveCommand(sock, chatId) {
    awayState.isAway = false;
    awayState.reason = '';
    awayState.notifiedUsers.clear();

    await sock.sendMessage(chatId, { text: 'Away mode deactivated. Welcome back!' });
}

// Handle incoming messages
async function handleIncomingMessage(sock, message) {
    const senderId = message.key.remoteJid;
    const isPrivateChat = !senderId.endsWith('@g.us');

    if (awayState.isAway && isPrivateChat && !awayState.notifiedUsers.has(senderId)) {
        // Notify the sender if Away
        const replyMessage = `I am currently away: ${awayState.reason}`;
        await sock.sendMessage(senderId, { text: replyMessage });
        awayState.notifiedUsers.add(senderId);
    }
}

// Command parser and execution
async function onCommand(sock, message) {
    const text = message.message?.conversation || '';
    const args = text.split(' ');
    const command = args[0].toLowerCase();
    const chatId = message.key.remoteJid;

    if (command === 'away') {
        const reason = args.slice(1).join(' ');
        await handleAwayCommand(sock, chatId, reason);
    } else if (command === 'active') {
        await handleActiveCommand(sock, chatId);
    }
}

module.exports = {
    handleIncomingMessage,
    onCommand,
};

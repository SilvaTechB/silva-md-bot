const { WAConnection } = require('@whiskeysockets/baileys');

// Data structure to track user messages
const userMessages = new Map();
const SPAM_LIMIT = 5; // Maximum messages allowed
const TIME_LIMIT = 30 * 1000; // Time limit in milliseconds (30 seconds)

// Initialize WhatsApp connection
const conn = new WAConnection();

conn.on('open', () => {
    console.log('Bot is online!');
});

// Function to track messages
function trackMessage(groupId, userId) {
    const now = Date.now();

    // Initialize group data if not already present
    if (!userMessages.has(groupId)) {
        userMessages.set(groupId, new Map());
    }
    const groupData = userMessages.get(groupId);

    // Initialize user data if not already present
    if (!groupData.has(userId)) {
        groupData.set(userId, []);
    }
    const messages = groupData.get(userId);

    // Add the current timestamp to the user's message history
    messages.push(now);

    // Remove timestamps older than TIME_LIMIT
    const recentMessages = messages.filter(timestamp => now - timestamp <= TIME_LIMIT);
    groupData.set(userId, recentMessages);

    // Check if the user has exceeded the spam limit
    if (recentMessages.length >= SPAM_LIMIT) {
        return true; // User is spamming
    }

    return false; // User is not spamming
}

// Function to handle incoming messages
conn.on('chat-update', async (chat) => {
    if (!chat.hasNewMessage) return;
    const message = chat.messages.all()[0];

    // Check if the message is in a group
    if (message.key.remoteJid.endsWith('@g.us')) {
        const groupId = message.key.remoteJid;
        const userId = message.key.participant || message.key.remoteJid;
        const text = message.message.conversation || '';

        // Track the message and check for spam
        const isSpamming = trackMessage(groupId, userId);

        if (isSpamming) {
            // Send a warning message to the group
            const warningMessage = `⚠️ @${userId.split('@')[0]}, please avoid spamming the group!`;
            await conn.sendMessage(groupId, warningMessage, {
                quoted: message,
                contextInfo: {
                    mentionedJid: [userId]
                }
            });
        }
    }
});

// Periodic cleanup to remove old data and save memory
setInterval(() => {
    const now = Date.now();

    userMessages.forEach((groupData, groupId) => {
        groupData.forEach((timestamps, userId) => {
            const recentMessages = timestamps.filter(timestamp => now - timestamp <= TIME_LIMIT);
            if (recentMessages.length === 0) {
                groupData.delete(userId); // Remove user if no recent messages
            } else {
                groupData.set(userId, recentMessages);
            }
        });

        // Remove group if no users are left
        if (groupData.size === 0) {
            userMessages.delete(groupId);
        }
    });
}, 60 * 1000); // Run cleanup every 60 seconds

// Connect to WhatsApp
(async () => {
    await conn.connect();
})();
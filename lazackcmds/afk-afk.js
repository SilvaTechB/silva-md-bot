// AFK Script: Standalone Version

// In-memory database to store user data
const db = {};

// Function to format duration into hh:mm:ss
function formatDuration(ms) {
  const seconds = Math.floor(ms / 1000) % 60;
  const minutes = Math.floor(ms / (1000 * 60)) % 60;
  const hours = Math.floor(ms / (1000 * 60 * 60));
  return [hours, minutes, seconds]
    .map((v) => v.toString().padStart(2, '0'))
    .join(':');
}

// Main function to handle AFK logic
async function handleMessage(message) {
  // Ensure the message and sender exist
  if (!message || !message.sender) return;
  
  // Initialize user data in the database if it doesn't exist
  if (!db[message.sender]) {
    db[message.sender] = { afk: -1, afkReason: '' };
  }

  const user = db[message.sender];
  const text = message.text?.toLowerCase() || '';

  // Command: Set AFK status
  if (text.startsWith('afk ')) {
    const reason = text.slice(4).trim(); // Extract reason
    if (!reason) {
      return await reply(message, "❌ Please provide a reason after 'afk'. Example: 'afk I'm busy'.");
    }

    user.afk = Date.now(); // Set AFK timestamp
    user.afkReason = reason; // Store AFK reason
    return await reply(message, `💤 You are now AFK with reason: ${reason}`);
  }

  // Command: Deactivate AFK status
  if (text === 'active') {
    if (user.afk > -1) {
      const afkDuration = formatDuration(Date.now() - user.afk); // Calculate AFK duration
      user.afk = -1; // Reset AFK status
      user.afkReason = ''; // Clear AFK reason
      return await reply(message, `✅ You are no longer AFK! ▢ *AFK Duration:* ${afkDuration}`);
    } else {
      return await reply(message, "❌ You are not currently AFK.");
    }
  }

  // Handle mentions or private messages
  const mentionedJids = [
    ...(message.mentionedJid || []),
    ...(message.quoted ? [message.quoted.sender] : []),
  ];

  for (const mentionedJid of mentionedJids) {
    const mentionedUser = db[mentionedJid];
    if (!mentionedUser || mentionedUser.afk < 0) continue; // Skip if not AFK

    const afkDuration = formatDuration(Date.now() - mentionedUser.afk);
    const reason = mentionedUser.afkReason || 'Without reason';

    await reply(
      message,
      `🛌 The user you mentioned is AFK:\n▢ *Reason:* ${reason}\n▢ *AFK Duration:* ${afkDuration}`
    );
  }

  // Notify sender in private chats if the recipient is AFK
  if (message.chat.endsWith('@s.whatsapp.net')) {
    const recipient = db[message.chat];
    if (recipient && recipient.afk > -1) {
      const afkDuration = formatDuration(Date.now() - recipient.afk);
      const reason = recipient.afkReason || 'Without reason';

      await reply(
        message,
        `💤 The user you are messaging is currently AFK:\n▢ *Reason:* ${reason}\n▢ *AFK Duration:* ${afkDuration}`
      );
    }
  }
}

// Mock reply function to simulate bot replies
async function reply(message, response) {
  console.log(`Replying to ${message.sender}: ${response}`);
}

// Example message input for testing
const testMessages = [
  { sender: 'user1', text: 'afk I am busy', chat: 'user1@s.whatsapp.net' },
  { sender: 'user1', text: 'active', chat: 'user1@s.whatsapp.net' },
  { sender: 'user2', text: 'Hello', mentionedJid: ['user1'] },
];

// Simulate processing messages
for (const msg of testMessages) {
  handleMessage(msg);
}

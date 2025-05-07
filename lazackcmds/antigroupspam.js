// ☠️ DON'T COPY PASTE SILVA TECH INC CODE. OUR CODES ARE FOR TESTING 
// 🌟 Silva MD Anti-Spam Plugin (Clean + Fixed)

const messageTracker = {};
const warnedUsers = {}; // Track users who were already warned

export async function before(m, { conn }) {
  if (!m.isGroup || !m.sender || m.fromMe) return;

  const chatId = m.chat;
  const senderId = m.sender;
  const key = `${chatId}-${senderId}`;
  const now = Date.now();
  const timeLimit = 45 * 1000; // 45 seconds
  const maxMessages = 5;
  const cooldown = 5 * 60 * 1000; // 5 minutes cooldown per user

  if (!messageTracker[key]) messageTracker[key] = [];

  messageTracker[key].push(now);
  messageTracker[key] = messageTracker[key].filter(ts => now - ts <= timeLimit);

  if (messageTracker[key].length > maxMessages) {
    const lastWarned = warnedUsers[key] || 0;

    if (now - lastWarned > cooldown) {
      await conn.sendMessage(chatId, {
        text: `🚨 *Stop Spamming!*\n@${senderId.split('@')[0]}, you've sent more than ${maxMessages} messages in under 45 seconds.\nPlease slow down or face Silva consequences. 💖\n\n Silva Md Bot cooling Down`,
        contextInfo: {
          mentionedJid: [senderId],
          forwardingScore: 999,
          isForwarded: true,
          forwardedNewsletterMessageInfo: {
            newsletterJid: '120363200367779016@newsletter',
            newsletterName: 'Silva md Bot • Spam Detector',
            serverMessageId: 143,
          },
        },
      }, { quoted: m });

      warnedUsers[key] = now; // ✅ Add this to start cooldown timer
      messageTracker[key] = []; // Optional reset after warning
    }
  }
}

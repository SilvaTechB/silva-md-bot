// ☠️ DON'T COPY PASTE SILVA TECH INC CODE. OUR CODES ARE FOR TESTING 
// 🌟 Silva MD Anti-Spam Plugin (Strict Message Only)

const messageTracker = {};
const warnedUsers = {};

export async function before(m, { conn }) {
  if (!m.isGroup || !m.sender || m.fromMe) return;

  // Ignore presence updates or non-message events
  if (!m.message || Object.keys(m.message).length === 0) return;

  // Skip if message is only a presence (like typing or recording)
  const ignoredTypes = ['senderKeyDistributionMessage', 'protocolMessage', 'messageContextInfo'];
  const actualContent = Object.keys(m.message).find(key => !ignoredTypes.includes(key));
  if (!actualContent) return;

  const chatId = m.chat;
  const senderId = m.sender;
  const key = `${chatId}-${senderId}`;
  const now = Date.now();
  const timeLimit = 45 * 1000; // 45 seconds
  const maxMessages = 5;
  const cooldown = 5 * 60 * 1000; // 5 minutes

  if (!messageTracker[key]) messageTracker[key] = [];

  messageTracker[key].push(now);
  messageTracker[key] = messageTracker[key].filter(ts => now - ts <= timeLimit);

  if (messageTracker[key].length > maxMessages) {
    const lastWarned = warnedUsers[key] || 0;

    if (now - lastWarned > cooldown) {
      await conn.sendMessage(chatId, {
        text: `🚨 *Stop Spamming!*\n@${senderId.split('@')[0]}, you've sent more than ${maxMessages} messages in under 45 seconds.\nPlease slow down or face Silva consequences. 💖\n\n_Silva MD Bot cooling down..._`,
        contextInfo: {
          mentionedJid: [senderId],
          forwardingScore: 999,
          isForwarded: true,
          forwardedNewsletterMessageInfo: {
            newsletterJid: '120363200367779016@newsletter',
            newsletterName: 'Silva MD Bot • Spam Detector',
            serverMessageId: 143,
          },
        },
      }, { quoted: m });

      warnedUsers[key] = now;
      messageTracker[key] = []; // Optional reset
    }
  }
}

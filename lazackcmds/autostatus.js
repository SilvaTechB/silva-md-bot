export async function before(statusUpdate, {
  conn: botConnection,
  isAdmin,
  isBotAdmin
}) {
  // Only process if the update is a status
  if (statusUpdate.key.remoteJid !== 'status@broadcast') {
    return false;
  }

  // Initialize the story array if it doesn't exist
  this.story = this.story || [];

  // List of motivational quotes
  const motivationalQuotes = [
    "Believe you can and you're halfway there.",
    "Every day may not be good, but there is something good in every day.",
    "The only limit to our realization of tomorrow is our doubts of today.",
    "Success is not final, failure is not fatal: It is the courage to continue that counts.",
    "Start where you are. Use what you have. Do what you can.",
    "Stay positive, work hard, and make it happen.",
    "You are stronger than you think.",
    "Dream big and dare to fail.",
    "Happiness is not something ready-made. It comes from your own actions.",
    "Difficult roads often lead to beautiful destinations."
  ];

  // Select a random motivational quote
  const randomQuote = motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)];

  try {
    // Send the motivational quote as a reply to the status update
    await this.reply(statusUpdate.sender, randomQuote, statusUpdate, {
      mentions: [statusUpdate.sender]
    });
    console.log(`Motivational quote sent to ${statusUpdate.sender.split('@')[0]}`);
  } catch (error) {
    console.error("Error sending motivational quote:", error);
  }

  // Automatically react to the status with 🙏 emoji
  try {
    await this.sendMessage(statusUpdate.sender, {
      react: {
        text: '🙏',
        key: statusUpdate.key
      }
    });
    console.log('Reacted to status with 🙏');
  } catch (reactionError) {
    console.error('Failed to react to status:', reactionError);
  }

  // Check if the bot has viewStory enabled in chat settings
  const chatSettings = global.db.data.chats[statusUpdate.chat];
  return chatSettings && chatSettings.viewStory ? true : false;
}

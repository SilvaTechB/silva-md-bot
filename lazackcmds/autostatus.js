export async function before(statusUpdate, {
  conn: botConnection,
  isAdmin,
  isBotAdmin
}) {
  // Only process if the update is a status
  if (statusUpdate.key.remoteJid !== 'status@broadcast') {
    return false;
  }

  // Initialize the story array and the last quote sent timestamp if they don't exist
  this.story = this.story || [];
  this.lastQuoteSent = this.lastQuoteSent || {}; // Store the last time the quote was sent

  // List of motivational quotes
  const motivationalQuotes = [
    "Believe you can and you're halfway there.SILVA MD BOT",
    "Every day may not be good, but there is something good in every day.SILVA MD BOT",
    "The only limit to our realization of tomorrow is our doubts of today.SILVA MD BOT",
    "Success is not final, failure is not fatal: It is the courage to continue that counts.SILVA MD BOT",
    "Start where you are. Use what you have. Do what you can.SILVA MD BOT",
    "Stay positive, work hard, and make it happen.SILVA MD BOT",
    "You are stronger than you think.SILVA MD BOT",
    "Dream big and dare to fail.SILVA MD BOT",
    "Happiness is not something ready-made. It comes from your own actions.SILVA MD BOT",
    "Difficult roads often lead to beautiful destinations.SILVA MD BOT"
  ];

  // Get the current time
  const currentTime = Date.now();
  const lastQuoteTime = this.lastQuoteSent[statusUpdate.sender] || 0;

  // Only send a quote if 24 hours have passed
  if (currentTime - lastQuoteTime < 24 * 60 * 60 * 1000) {
    console.log("24 hours haven't passed since the last motivational quote.");
    return false; // Don't send the quote if 24 hours haven't passed
  }

  // Select a random motivational quote
  const randomQuote = motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)];

  try {
    // Send the motivational quote as a reply to the status update
    await this.reply(statusUpdate.sender, randomQuote, statusUpdate, {
      mentions: [statusUpdate.sender]
    });
    console.log(`Motivational quote sent to ${statusUpdate.sender.split('@')[0]}`);

    // Update the last quote sent timestamp
    this.lastQuoteSent[statusUpdate.sender] = currentTime;
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

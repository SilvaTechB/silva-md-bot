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
    "Believe you can and you're halfway there. SILVA MD BOT",
    "Every day may not be good, but there is something good in every day. SILVA MD BOT",
    "The only limit to our realization of tomorrow is our doubts of today. SILVA MD BOT",
    "Success is not final, failure is not fatal: It is the courage to continue that counts. SILVA MD BOT",
    "Start where you are. Use what you have. Do what you can. SILVA MD BOT",
    "Stay positive, work hard, and make it happen. SILVA MD BOT",
    "You are stronger than you think. SILVA MD BOT",
    "Dream big and dare to fail. SILVA MD BOT",
    "Happiness is not something ready-made. It comes from your own actions. SILVA MD BOT",
    "Difficult roads often lead to beautiful destinations. SILVA MD BOT",
    "Success is not just about making money. It’s about making a difference. SILVA MD BOT",
    "Believe in yourself and all that you are. SILVA MD BOT",
    "You have within you right now, everything you need to deal with whatever the world can throw at you. SILVA MD BOT",
    "Be so good they can't ignore you. SILVA MD BOT",
    "Your life only gets better when you get better. SILVA MD BOT",
    "Don't watch the clock; do what it does. Keep going. SILVA MD BOT",
    "The harder you work for something, the greater you’ll feel when you achieve it. SILVA MD BOT",
    "Success is a journey, not a destination. SILVA MD BOT",
    "Don't wait for opportunity. Create it. SILVA MD BOT",
    "Push yourself, because no one else is going to do it for you. SILVA MD BOT",
    "Your limitation—it's only your imagination. SILVA MD BOT",
    "Great things never come from comfort zones. SILVA MD BOT",
    "Dream it. Wish it. Do it. SILVA MD BOT",
    "Success doesn’t just find you. You have to go out and get it. SILVA MD BOT",
    "The key to success is to start before you are ready. SILVA MD BOT",
    "Sometimes later becomes never. Do it now. SILVA MD BOT",
    "The only way to do great work is to love what you do. SILVA MD BOT",
    "Don't stop when you're tired. Stop when you're done. SILVA MD BOT",
    "Wake up with determination. Go to bed with satisfaction. SILVA MD BOT",
    "Do something today that your future self will thank you for. SILVA MD BOT",
    "Little things make big days. SILVA MD BOT",
    "It’s going to be hard, but hard does not mean impossible. SILVA MD BOT",
    "Don’t limit your challenges. Challenge your limits. SILVA MD BOT",
    "Stay focused and never give up. SILVA MD BOT",
    "Stay hungry. Stay foolish. SILVA MD BOT",
    "You don’t have to be great to start, but you have to start to be great. SILVA MD BOT",
    "Be willing to be a beginner every single morning. SILVA MD BOT",
    "Success usually comes to those who are too busy to be looking for it. SILVA MD BOT",
    "What seems to us as bitter trials are often blessings in disguise. SILVA MD BOT",
    "Work hard in silence, let your success be your noise. SILVA MD BOT",
    "Success is what happens after you’ve survived all your mistakes. SILVA MD BOT",
    "Fall seven times, stand up eight. SILVA MD BOT",
    "Hardships often prepare ordinary people for an extraordinary destiny. SILVA MD BOT",
    "Success is not how high you have climbed, but how you make a positive difference to the world. SILVA MD BOT",
    "The only place where success comes before work is in the dictionary. SILVA MD BOT",
    "Don’t let yesterday take up too much of today. SILVA MD BOT",
    "You don’t have to see the whole staircase, just take the first step. SILVA MD BOT",
    "Small steps in the right direction can turn out to be the biggest step of your life. SILVA MD BOT",
    "Success is not in what you have, but who you are. SILVA MD BOT",
    "If you want to achieve greatness stop asking for permission. SILVA MD BOT",
    "Go as far as you can see; when you get there, you’ll be able to see further. SILVA MD BOT",
    "Doubt kills more dreams than failure ever will. SILVA MD BOT",
    "You miss 100% of the shots you don’t take. SILVA MD BOT",
    "The only way to achieve the impossible is to believe it is possible. SILVA MD BOT",
    "A journey of a thousand miles begins with a single step. SILVA MD BOT",
    "To accomplish great things, we must not only act but also dream; not only plan but also believe. SILVA MD BOT",
    "Success is not the key to happiness. Happiness is the key to success. SILVA MD BOT",
    "Everything you can imagine is real. SILVA MD BOT",
    "Believe in yourself, push your limits, and do whatever it takes to conquer your goals. SILVA MD BOT",
    "Don't stop until you're proud. SILVA MD BOT",
    "You are capable of amazing things. SILVA MD BOT",
    "Don’t be afraid to give up the good to go for the great. SILVA MD BOT",
    "Act as if what you do makes a difference. It does. SILVA MD BOT",
    "Keep your face always toward the sunshine—and shadows will fall behind you. SILVA MD BOT",
    "Success is the sum of small efforts, repeated day in and day out. SILVA MD BOT",
    "The future belongs to those who believe in the beauty of their dreams. SILVA MD BOT",
    "What we achieve inwardly will change outer reality. SILVA MD BOT",
    "With the new day comes new strength and new thoughts. SILVA MD BOT",
    "Don’t be pushed around by the fears in your mind. Be led by the dreams in your heart. SILVA MD BOT",
    "There are no limits to what you can accomplish, except the limits you place on your own thinking. SILVA MD BOT",
    "Everything you’ve ever wanted is on the other side of fear. SILVA MD BOT",
    "Believe in your infinite potential. SILVA MD BOT",
    "Rise above the storm, and you will find the sunshine. SILVA MD BOT",
    "Success is walking from failure to failure with no loss of enthusiasm. SILVA MD BOT",
    "Strive not to be a success, but rather to be of value. SILVA MD BOT",
    "The only impossible journey is the one you never begin. SILVA MD BOT",
    "The best way to predict the future is to create it. SILVA MD BOT",
    "Life is short, and it is up to you to make it sweet. SILVA MD BOT",
    "Your time is limited, don’t waste it living someone else’s life. SILVA MD BOT",
    "If you set your goals ridiculously high and it’s a failure, you will fail above everyone else’s success. SILVA MD BOT",
    "Success is liking yourself, liking what you do, and liking how you do it. SILVA MD BOT",
    "If you can dream it, you can do it. SILVA MD BOT",
    "If opportunity doesn’t knock, build a door. SILVA MD BOT",
    "Don’t quit. Suffer now and live the rest of your life as a champion. SILVA MD BOT",
    "It’s never too late to be what you might’ve been. SILVA MD BOT",
    "Don’t be afraid to give up the good to go for the great. SILVA MD BOT",
    "Success is a state of mind. If you want success, start thinking of yourself as a success. SILVA MD BOT"
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

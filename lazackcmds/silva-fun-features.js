// 🌀 Silva MD: Group Mood Analyzer
let moodAnalyzer = async (m, { conn, participants, messages }) => {
  let msgs = await conn.fetchMessages(m.chat, 50);
  let scores = { positive: 0, negative: 0, neutral: 0 };
  const sentiments = require('sentiment');
  const analyze = new sentiments();
  for (let msg of msgs) {
    let result = analyze.analyze(msg.message?.conversation || '');
    if (result.score > 0) scores.positive++;
    else if (result.score < 0) scores.negative++;
    else scores.neutral++;
  }
  let mood = '😐 Neutral';
  if (scores.positive > scores.negative) mood = '😄 Happy';
  else if (scores.negative > scores.positive) mood = '😡 Toxic';
  else if (scores.positive + scores.negative === 0) mood = '💀 Dead';
  conn.sendMessage(m.chat, { text: `🧠 *Group Mood:* ${mood}` });
};
moodAnalyzer.help = ['moodcheck'];
moodAnalyzer.tags = ['fun'];
moodAnalyzer.command = ['moodcheck'];
moodAnalyzer.group = true;

// 💌 Secret Admirer
let secretAdmirer = async (m, { conn, args }) => {
  let user = m.mentionedJid[0];
  if (!user) return m.reply('Tag someone to admire.');
  await conn.sendMessage(user, {
    text: '💌 Someone in your group secretly admires you! Keep shining! ✨',
  });
  m.reply('✅ Your secret message has been sent anonymously.');
};
secretAdmirer.help = ['admire'];
secretAdmirer.tags = ['fun'];
secretAdmirer.command = ['admire'];
secretAdmirer.group = true;
secretAdmirer.admin = true;

// ⏰ Karma Tracker
let karmaDB = {};
let karmaReact = async (m, { conn }) => {
  let sender = m.sender;
  karmaDB[sender] = karmaDB[sender] || { up: 0, down: 0 };
  if (m.reaction?.text === '👍') karmaDB[sender].up++;
  else if (m.reaction?.text === '👎') karmaDB[sender].down++;
};
let karmaStats = async (m, { conn }) => {
  let stat = Object.entries(karmaDB)
    .map(([u, k]) => `@${u.split('@')[0]} 👍${k.up} 👎${k.down}`)
    .join('\n');
  conn.sendMessage(m.chat, { text: `🏆 *Karma Stats:*\n${stat}`, mentions: Object.keys(karmaDB) });
};
karmaStats.help = ['karmastats'];
karmaStats.tags = ['fun'];
karmaStats.command = ['karmastats'];

// 🎉 Daily Dare
const dailyDare = async (m, { conn }) => {
  let dares = [
    'Send your last selfie to the group. 😳',
    'Change your name to "I Love Broccoli" for 1 hour 🥦',
    'Message your crush and send proof 💘',
    'Sing a song in a voice note 🎤'
  ];
  let dare = dares[Math.floor(Math.random() * dares.length)];
  conn.sendMessage(m.chat, { text: `🎯 *Today's Dare:* ${dare}\nType *I accept* to claim!` });
};
dailyDare.help = ['dailydare'];
dailyDare.tags = ['fun'];
dailyDare.command = ['dailydare'];
dailyDare.group = true;

// 🤫 Expose A Lie
const expose = async (m, { conn, args }) => {
  let user = m.mentionedJid[0];
  if (!user) return m.reply('Tag someone to expose 😈');
  let lies = [
    'Once cried over lost airtime 😭',
    'Has 4 burner accounts for stalking 🕵️‍♂️',
    'Eats pizza with milk 🥴',
    'Thinks the moon landing was fake 🌕🚀'
  ];
  let lie = lies[Math.floor(Math.random() * lies.length)];
  conn.sendMessage(m.chat, { text: `👀 *Expose:* @${user.split('@')[0]} — ${lie}`, mentions: [user] });
};
expose.help = ['expose'];
expose.tags = ['fun'];
expose.command = ['expose'];
expose.group = true;

// 🧠 AI Life Advice
const advice = async (m, { conn }) => {
  let tips = [
    'Don’t chase people. Be an example. Attract them. 💫',
    'Your vibe attracts your tribe. 🔥',
    'Protect your peace. ✌️',
    'You are one decision away from a totally different life. 🌍'
  ];
  let tip = tips[Math.floor(Math.random() * tips.length)];
  conn.sendMessage(m.chat, { text: `🧘 *AI Life Advice:*\n${tip}` });
};
advice.help = ['adviceme'];
advice.tags = ['fun'];
advice.command = ['adviceme'];

// 🥷 Ghost Me
const ghostMe = async (m, { conn }) => {
  conn.ghosted = conn.ghosted || {};
  conn.ghosted[m.sender] = Date.now() + 86400000;
  m.reply('👻 You are now invisible to the bot for 24 hours.');
};
ghostMe.help = ['ghostme'];
ghostMe.tags = ['fun'];
ghostMe.command = ['ghostme'];

// 🎙️ Voice Confess (pseudo code)
// This would require additional logic to record and forward voice without sender — too complex for in-text.

// 🎭 Emoji Persona Detector
const emojiMe = async (m, { conn }) => {
  let emojis = ['💅', '🔥', '🧠', '😂', '😈', '😴', '👑'];
  let result = emojis[Math.floor(Math.random() * emojis.length)];
  conn.sendMessage(m.chat, { text: `🧬 *Your Vibe:* ${result}` });
};
emojiMe.help = ['whatsmyemoji'];
emojiMe.tags = ['fun'];
emojiMe.command = ['whatsmyemoji'];

// 💬 MyStory Generator
const storyGen = async (m, { conn, text }) => {
  if (!text) return m.reply('Give me 2-3 keywords like: `.mystory moon picnic`');
  let [a, b, c] = text.split(" ");
  let story = `Under the ${a}, they met unexpectedly for a ${b}. As the ${c || 'rain'} poured, secrets unraveled, and hearts whispered the truth they always hid.`;
  conn.sendMessage(m.chat, { text: `📖 *Generated Story:*
${story}` });
};
storyGen.help = ['mystory'];
storyGen.tags = ['fun'];
storyGen.command = ['mystory'];

export default [
  moodAnalyzer,
  secretAdmirer,
  karmaStats,
  dailyDare,
  expose,
  advice,
  ghostMe,
  emojiMe,
  storyGen
];

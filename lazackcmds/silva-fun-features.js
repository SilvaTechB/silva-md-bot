// 🌀 Silva MD: Group Mood Analyzer
let moodAnalyzer = async (m, { conn }) => {
  const Sentiment = require('sentiment');
  const analyzer = new Sentiment();
  let msgs = await conn.fetchMessages(m.chat, 50);
  let scores = { positive: 0, negative: 0, neutral: 0 };

  for (let msg of msgs) {
    let text = msg.message?.conversation || '';
    let result = analyzer.analyze(text);
    if (result.score > 0) scores.positive++;
    else if (result.score < 0) scores.negative++;
    else scores.neutral++;
  }

  let mood = '😐 Neutral';
  if (scores.positive > scores.negative) mood = '😄 Happy';
  else if (scores.negative > scores.positive) mood = '😡 Toxic';
  else if (scores.positive + scores.negative === 0) mood = '💀 Dead';

  let message = `🧠 *Group Mood:* ${mood}`;
  await conn.sendMessage(m.chat, {
    text: message,
    contextInfo: {
      mentionedJid: [m.sender],
      forwardingScore: 999,
      isForwarded: true,
      forwardedNewsletterMessageInfo: {
        newsletterJid: '120363200367779016@newsletter',
        newsletterName: 'GROUP MOOD ANALYZER 🧠',
        serverMessageId: 143
      }
    }
  });
};
moodAnalyzer.help = ['moodcheck'];
moodAnalyzer.tags = ['fun'];
moodAnalyzer.command = ['moodcheck'];
moodAnalyzer.group = true;

// 💌 Secret Admirer
let secretAdmirer = async (m, { conn }) => {
  let user = m.mentionedJid[0];
  if (!user) return m.reply('Tag someone to admire.');
  await conn.sendMessage(user, {
    text: '💌 Someone in your group secretly admires you! Keep shining! ✨',
  });
  let message = '✅ Your secret message has been sent anonymously.';
  await conn.sendMessage(m.chat, {
    text: message,
    contextInfo: {
      mentionedJid: [m.sender],
      forwardingScore: 999,
      isForwarded: true,
      forwardedNewsletterMessageInfo: {
        newsletterJid: '120363200367779016@newsletter',
        newsletterName: 'SECRET ADMIRER 💌',
        serverMessageId: 143
      }
    }
  });
};
secretAdmirer.help = ['admire'];
secretAdmirer.tags = ['fun'];
secretAdmirer.command = ['admire'];
secretAdmirer.group = true;
secretAdmirer.admin = true;

// 🧘 AI Life Advice
const advice = async (m, { conn }) => {
  let tips = [
    'Don’t chase people. Be an example. Attract them. 💫',
    'Your vibe attracts your tribe. 🔥',
    'Protect your peace. ✌️',
    'You are one decision away from a totally different life. 🌍'
  ];
  let tip = tips[Math.floor(Math.random() * tips.length)];
  let message = `🧘 *AI Life Advice:*\n${tip}`;
  await conn.sendMessage(m.chat, {
    text: message,
    contextInfo: {
      mentionedJid: [m.sender],
      forwardingScore: 999,
      isForwarded: true,
      forwardedNewsletterMessageInfo: {
        newsletterJid: '120363200367779016@newsletter',
        newsletterName: 'AI LIFE ADVICE 🧘',
        serverMessageId: 143
      }
    }
  });
};
advice.help = ['adviceme'];
advice.tags = ['fun'];
advice.command = ['adviceme'];

// 🎭 Emoji Persona Detector
const emojiMe = async (m, { conn }) => {
  let emojis = ['💅', '🔥', '🧠', '😂', '😈', '😴', '👑'];
  let result = emojis[Math.floor(Math.random() * emojis.length)];
  let message = `🧬 *Your Vibe:* ${result}`;
  await conn.sendMessage(m.chat, {
    text: message,
    contextInfo: {
      mentionedJid: [m.sender],
      forwardingScore: 999,
      isForwarded: true,
      forwardedNewsletterMessageInfo: {
        newsletterJid: '120363200367779016@newsletter',
        newsletterName: 'EMOJI VIBE DETECTOR 🎭',
        serverMessageId: 143
      }
    }
  });
};
emojiMe.help = ['whatsmyemoji'];
emojiMe.tags = ['fun'];
emojiMe.command = ['whatsmyemoji'];

// 📖 MyStory Generator
const storyGen = async (m, { conn, text }) => {
  if (!text) return m.reply('Give me 2-3 keywords like: .mystory moon picnic');
  let [a, b, c] = text.split(" ");
  let story = `Under the ${a}, they met unexpectedly for a ${b}. As the ${c || 'rain'} poured, secrets unraveled, and hearts whispered the truth they always hid.`;
  let message = `📖 *Generated Story:*\n${story}`;
  await conn.sendMessage(m.chat, {
    text: message,
    contextInfo: {
      mentionedJid: [m.sender],
      forwardingScore: 999,
      isForwarded: true,
      forwardedNewsletterMessageInfo: {
        newsletterJid: '120363200367779016@newsletter',
        newsletterName: 'STORY GENERATOR 📖',
        serverMessageId: 143
      }
    }
  });
};
storyGen.help = ['mystory'];
storyGen.tags = ['fun'];
storyGen.command = ['mystory'];

export default [
  moodAnalyzer,
  secretAdmirer,
  advice,
  emojiMe,
  storyGen
];

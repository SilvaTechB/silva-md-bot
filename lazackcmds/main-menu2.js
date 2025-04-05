import { createHash } from 'crypto';
import moment from 'moment-timezone';
import { xpRange } from '../lib/levelling.js';

const handler = async (m, { conn, usedPrefix, command }) => {
  const menuThumbnail = 'https://i.ibb.co/TkqLg09/silva-md-bot.jpg'; // replace with your hosted image if needed

  const now = new Date(Date.now() + 3600000);
  const locale = 'en';
  const date = now.toLocaleDateString(locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const wib = moment.tz('Africa/Nairobi').format('HH:mm:ss');
  const uptime = clockString(process.uptime() * 1000);

  const who = m.quoted?.sender || m.mentionedJid?.[0] || (m.fromMe ? conn.user.jid : m.sender);
  if (!(who in global.db.data.users)) throw '✳️ User not found in database!';

  const user = global.db.data.users[who];
  const { exp, level, diamond, role, name } = user;
  const { min, xp, max } = xpRange(level, global.multiplier);

  const taguser = '@' + who.split('@')[0];
  const sn = createHash('md5').update(who).digest('hex');
  const totalUsers = Object.keys(global.db.data.users).length;
  const registered = Object.values(global.db.data.users).filter(u => u.registered).length;

  const quote = quotes[Math.floor(Math.random() * quotes.length)];
  const greeting = getGreeting();

  const status = `
🌟 *${greeting}, ${name}!* 🌟
💫 *Here’s your bot menu update...*

💬 _Quote of the moment:_ 
❝ *${quote}* ❞

──◆ 📊 *User Info* ◆──
👤 Name: *${name}*
💠 XP: *${exp}*
💎 Diamonds: *${diamond}*
🎖️ Level: *${level}*
🏅 Role: *${role}*
🧾 Hash: *${sn.slice(0, 8)}*

──◆ 📆 *System Info* ◆──
📅 Date: *${date}*
⏰ Time: *${wib}*
📈 Uptime: *${uptime}*
🗂️ DB Users: *${registered}/${totalUsers}*

──◆ 🧭 *Menu Shortcuts* ◆──
👑 ${usedPrefix}ownermenu
👥 ${usedPrefix}groupmenu
📥 ${usedPrefix}dlmenu
🎮 ${usedPrefix}gamemenu
🛠️ ${usedPrefix}toolmenu
🎨 ${usedPrefix}logomenu
🌙 ${usedPrefix}nsfwmenu
📜 ${usedPrefix}botmenu
📚 ${usedPrefix}list or ${usedPrefix}help2 (all cmds)

🔗 Newsletter: @SILVA MD BOT 💖
`;

  await conn.sendMessage(m.chat, {
    image: { url: menuThumbnail },
    caption: status,
    contextInfo: {
      mentionedJid: [m.sender],
      forwardingScore: 999,
      isForwarded: true,
      forwardedNewsletterMessageInfo: {
        newsletterJid: '120363200367779016@newsletter',
        newsletterName: 'SILVA MD BOT 💖',
        serverMessageId: 143,
      },
    },
  }, { quoted: m });

  m.react('✅');
};

handler.help = ['menu2', 'help2'];
handler.tags = ['main'];
handler.command = ['menu2', 'help2'];

export default handler;

// Utility: Clock Formatter
function clockString(ms) {
  const h = isNaN(ms) ? '--' : Math.floor(ms / 3600000);
  const m = isNaN(ms) ? '--' : Math.floor(ms / 60000) % 60;
  const s = isNaN(ms) ? '--' : Math.floor(ms / 1000) % 60;
  return [h, m, s].map(v => v.toString().padStart(2, 0)).join(':');
}

// Utility: Time-Based Greetings
function getGreeting() {
  const hour = +moment.tz('Africa/Nairobi').format('HH');
  if (hour >= 18) return 'Good Night 🌙';
  if (hour >= 15) return 'Good Afternoon 🌇';
  if (hour >= 10) return 'Good Day ☀️';
  if (hour >= 4) return 'Good Morning 🌄';
  return 'Hello Early Bird 🌅';
}

// 🔥 Fresh Quotes
const quotes = [
  "Stay strong. Stand up. Have a voice.",
  "Do something today that your future self will thank you for.",
  "In the middle of every difficulty lies opportunity.",
  "Discipline is choosing between what you want now and what you want most.",
  "Success is not final, failure is not fatal: It is the courage to continue that counts.",
  "Push yourself, because no one else is going to do it for you.",
  "Little progress each day adds up to big results.",
  "Be stronger than your strongest excuse.",
  "Great things never came from comfort zones.",
  "Believe you can and you're halfway there."
];

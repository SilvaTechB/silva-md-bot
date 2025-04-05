import { xpRange } from '../lib/levelling.js';
import moment from 'moment-timezone';
import { createHash } from 'crypto';

const handler = async (m, { conn, usedPrefix }) => {
  const name = conn.getName(m.sender);
  const user = global.db.data.users[m.sender];
  const { exp, level, diamond, role } = user;
  const { min, xp, max } = xpRange(level, global.multiplier);

  const taguser = '@' + m.sender.split('@')[0];
  const date = moment.tz('Africa/Nairobi').format('DD/MM/YYYY');
  const time = moment.tz('Africa/Nairobi').format('HH:mm:ss');
  const uptime = clockString(process.uptime() * 1000);

  const sn = createHash('md5').update(m.sender).digest('hex');

  const totalUsers = Object.keys(global.db.data.users).length;
  const registered = Object.values(global.db.data.users).filter(u => u.registered).length;

  const greeting = getGreeting();
  const quote = quotes[Math.floor(Math.random() * quotes.length)];

  const menuThumbnail = 'https://i.ibb.co/TkqLg09/silva-md-bot.jpg'; // You can change to your hosted image

  const status = `
${greeting} ${taguser} 👋

💭 _"${quote}"_

───「 *User Info* 」───
📛 Name: ${name}
🔢 Level: ${level}
⚔️ XP: ${exp}/${max}
💠 Diamonds: ${diamond}
🏅 Role: ${role}
🔗 SN: ${sn.slice(0, 8)}

───「 *System Info* 」───
📅 Date: ${date}
⏰ Time: ${time}
📊 Uptime: ${uptime}
👥 Users: ${registered}/${totalUsers}

───「 *Bot Menus* 」───
🧑‍💻 ${usedPrefix}ownermenu
👥 ${usedPrefix}groupmenu
📥 ${usedPrefix}dlmenu
🎮 ${usedPrefix}gamemenu
🎨 ${usedPrefix}logomenu
🔞 ${usedPrefix}nsfwmenu
⚙️ ${usedPrefix}toolmenu
📚 ${usedPrefix}botmenu
📑 ${usedPrefix}list or ${usedPrefix}help2

Newsletter: *SILVA MD BOT 💖*
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
        serverMessageId: 143
      }
    }
  }, { quoted: m });
};

handler.help = ['menu2', 'help2'];
handler.tags = ['main'];
handler.command = ['menu2', 'help2'];

export default handler;

// Greeting Function
function getGreeting() {
  const hour = moment.tz('Asia/Kolkata').hour();
  if (hour >= 18) return '🌙 Good Night';
  if (hour >= 15) return '🌇 Good Afternoon';
  if (hour >= 10) return '☀️ Good Day';
  if (hour >= 4) return '🌄 Good Morning';
  return '👋 Hello';
}

// Uptime Formatter
function clockString(ms) {
  let h = isNaN(ms) ? '--' : Math.floor(ms / 3600000);
  let m = isNaN(ms) ? '--' : Math.floor(ms / 60000) % 60;
  let s = isNaN(ms) ? '--' : Math.floor(ms / 1000) % 60;
  return [h, m, s].map(v => v.toString().padStart(2, '0')).join(':');
}

// Quotes
const quotes = [
  "Believe in yourself and all that you are.",
  "Every day is a fresh start.",
  "Push harder than yesterday if you want a different tomorrow.",
  "Dream it. Wish it. Do it.",
  "Progress over perfection.",
  "Don't stop until you're proud.",
  "Discipline is doing it even when you don't feel like it.",
  "Strive for greatness.",
  "You are stronger than you think.",
  "Hard work beats talent when talent doesn't work hard."
];

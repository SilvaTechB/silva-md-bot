import os from 'os';
import fs from 'fs';
import path from 'path';
import moment from 'moment-timezone';
import { promisify } from 'util';

const readdir = promisify(fs.readdir);

let handler = async (m, { conn }) => {
  // Media resources
  const menuThumbnail = 'https://i.imgur.com/GomcuUg.jpeg';
  const audioUrl = 'https://github.com/SilvaTechB/silva-md-bot/raw/main/media/Menu.mp3';

  // Dynamic command loader
  const lazackPath = './lazackcmds';
  const commands = await readdir(lazackPath);
  const commandList = commands
    .map((cmd, idx) => `┠─ ◦ ${idx + 1}. ${path.parse(cmd).name}`)
    .join('\n');

  // Enhanced system monitor
  const sysInfo = {
    totalRAM: `${(os.totalmem() / (1024 ** 3)).toFixed(2)} GB`,
    usedRAM: `${((os.totalmem() - os.freemem()) / (1024 ** 3)).toFixed(2)} GB`,
    uptime: moment.duration(os.uptime(), 'seconds').humanize(),
    timestamp: moment.tz('Africa/Nairobi').format('ddd DD/MM/YY HH:mm:ss'),
    platform: `${os.platform()} ${os.arch()}`,
    version: '4.2.0',
    developer: '@SilvaTechB'
  };

  // Expanded theme collection
  const menuTemplates = {
    cyberpunk: ({ user, commands, ...info }) => `
╭──「 SILVA MD ⁣𓄹▸ᴮᴼᵀ 」
│ ◦ ʜᴇʏ ${user}
│ ◦ ${info.timestamp}
╰┬─────────────
╭┴─────────────
│ ˹⚡˼ ʀᴀᴍ: ${info.usedRAM}/${info.totalRAM}
│ ˹🕒˼ ᴜᴘᴛɪᴍᴇ: ${info.uptime}
│ ˹💻˼ ᴏs: ${info.platform}
╰┬─────────────
╭┴──「 ᴄᴏᴍᴍᴀɴᴅs 」
${commands}
╰──────────────────
🔗 github.com/SilvaTechB
    `.trim(),

    neon: ({ user, ...info }) => `
▗▄▄ ▸▸◂ 𝐒𝐈𝐋𝐕𝐀𝐌𝐃
  ╭───────────
  │ ◦ 𝗛𝗲𝘆 ${user}
  │ ◦ ${info.timestamp}
  ╰┬──────────
  ╭┴──────────
  │ 𝗥𝗔𝗠: ${info.usedRAM}/${info.totalRAM}
  │ 𝗨𝗣𝗧𝗜𝗠𝗘: ${info.uptime}
  ╰┬──────────
  ╭┴─「 𝗖𝗠𝗗𝗦 」
  ${commandList}
▄▖▝▝▖▄▄▄▖
    `.trim(),

    matrix: ({ user, ...info }) => `
╔═══════════════
║ █▀▀▀▀▀▀▀▀▀▀▀▀█
║ █ SILVA-MD █
║ █▄▄▄▄▄▄▄▄▄▄▄▄█
╠═══════════════
║ ◦ User: ${user}
║ ◦ ${info.timestamp}
╠═══════════════
║ » RAM: ${info.usedRAM}/${info.totalRAM}
║ » Uptime: ${info.uptime}
║ » OS: ${info.platform}
╠═══════════════
║ COMMANDS:
${commandList}
╚═══════════════
    `.trim(),

    futuristic: ({ user, ...info }) => `
┌─────────────────────────
│  ⚡ SILVA MD FUTURE EDITION ⚡
├─────────────────────────
│  ◦ User: ${user}
│  ◦ ${info.timestamp}
├─────────────────────────
│  » System Resources:
│     RAM: ${info.usedRAM}/${info.totalRAM}
│     Uptime: ${info.uptime}
│     Platform: ${info.platform}
├─────────────────────────
│  Available Commands:
${commandList}
└─────────────────────────
    `.trim(),

    minimal: ({ user, ...info }) => `
──────────────
 SILVA MD BOT
──────────────
• User: ${user}
• RAM: ${info.usedRAM}/${info.totalRAM}
• Uptime: ${info.uptime}
• Time: ${info.timestamp}
• OS: ${info.platform}
──────────────
Commands:
${commandList}
──────────────
    `.trim()
  };

  // Select random theme
  const themes = Object.keys(menuTemplates);
  const selectedTheme = themes[Math.floor(Math.random() * themes.length)];

  // Generate dynamic content
  const status = menuTemplates[selectedTheme]({
    user: m.pushName || 'User',
    commands: commandList,
    ...sysInfo
  });

  // Send multimedia menu with thumbnail
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

  // Send audio with metadata
  await conn.sendMessage(m.chat, { 
    audio: { url: audioUrl }, 
    mimetype: 'audio/mp4',
    ptt: true,
    contextInfo: {
      externalAdReply: {
        title: '✨ SILVA MD Experience',
        body: 'Advanced AI-Powered Bot',
        thumbnailUrl: menuThumbnail,
        mediaType: 1
      }
    }
  }, { quoted: m });
};

handler.help = ['menu'];
handler.tags = ['core'];
handler.command = ['menu', 'help'];

export default handler;

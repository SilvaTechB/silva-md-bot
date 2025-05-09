import os from 'os';
import fs from 'fs';
import path from 'path';
import moment from 'moment-timezone';
import { promisify } from 'util';

const readdir = promisify(fs.readdir);

let handler = async (m, { conn }) => {
  // Load media resources
  const menuImage = 'https://i.imgur.com/PEZ5QL2.jpeg';
  const audioUrl = 'https://github.com/SilvaTechB/silva-md-bot/raw/main/media/Menu.mp3';

  // Dynamic command loader with async/await
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
    version: '4.1.0',
    developer: '@SilvaTechB'
  };

  // Modern UI themes
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
    `.trim()
  };

  // Generate dynamic content
  const selectedTheme = Math.random() > 0.5 ? 'cyberpunk' : 'neon';
  const status = menuTemplates[selectedTheme]({
    user: m.pushName || 'User',
    commands: commandList,
    ...sysInfo
  });

  // Send multimedia menu
  await conn.sendMessage(m.chat, { 
    image: { url: menuImage },  
    caption: status,
    contextInfo: {
      mentionedJid: [m.sender],
      forwardingScore: 999,
      isForwarded: true,
      forwardedNewsletterMessageInfo: {
        newsletterJid: '120363200367779016@newsletter',
        newsletterName: 'SILVA SPARK 💖',
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
        thumbnailUrl: menuImage,
        mediaType: 1
      }
    }
  }, { quoted: m });
};

handler.help = ['menss'];
handler.tags = ['core'];
handler.command = ['menss', 'helpss'];

export default handler;

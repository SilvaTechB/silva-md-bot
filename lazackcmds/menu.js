import os from 'os';
import fs from 'fs';
import path from 'path';
import moment from 'moment-timezone';

let handler = async (m, { conn }) => {
  // Enhanced media resources with fallbacks
  const menuThumbnails = [
    'https://i.imgur.com/RDhF6iP.jpeg',
    'https://i.imgur.com/RDhF6iP.jpeg',
    'https://i.imgur.com/RDhF6iP.jpeg'
  ];
  const audioUrls = [
    'https://github.com/SilvaTechB/silva-md-bot/raw/main/media/Menu.mp3',
    'https://github.com/SilvaTechB/silva-md-bot/raw/main/media/Menu.mp3'
  ];

  // Random selection for media
  const randomThumbnail = menuThumbnails[Math.floor(Math.random() * menuThumbnails.length)];
  const randomAudio = audioUrls[Math.floor(Math.random() * audioUrls.length)];

  // Modern system monitor with additional metrics
  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2) + ' ' + sizes[i];
  };

  const cpuUsage = process.cpuUsage();
  const cpuPercent = ((cpuUsage.system + cpuUsage.user) / 1000).toFixed(2);

  const sysInfo = {
    totalRAM: formatBytes(os.totalmem()),
    usedRAM: formatBytes(os.totalmem() - os.freemem()),
    cpuLoad: `${cpuPercent}%`,
    uptime: moment.duration(os.uptime(), 'seconds').humanize(),
    timestamp: moment.tz('Africa/Nairobi').format('ddd DD/MM/YY HH:mm:ss'),
    platform: `${os.platform()} ${os.arch()}`,
    nodeVersion: process.version,
    botVersion: '3.0.0',
    developer: '@SilvaTechB'
  };

  // Modern menu templates with emoji variants
  const menuTemplates = {
    cyberpunk: ({ user, ...info }) => `
╭──「 𝗦𝗜𝗟𝗩𝗔 𝗠𝗗 𝗩𝟯 」
│ ✧ 𝗛𝗲𝘆 ${user}!
│ ✧ ${info.timestamp}
╰┬─────────────
╭┴─────────────
│ ⚡ 𝗥𝗔𝗠: ${info.usedRAM} / ${info.totalRAM}
│ 🖥️ 𝗖𝗣𝗨: ${info.cpuLoad}
│ 🕒 𝗨𝗽𝘁𝗶𝗺𝗲: ${info.uptime}
│ 💿 𝗢𝗦: ${info.platform}
╰┬─────────────
╭┴──「 𝗖𝗼𝗺𝗺𝗮𝗻𝗱𝘀 」
🤖 botmenu
👑 ownermenu
🧑‍🤝‍🧑 groupmenu
📥 dlmenu
🎉 funmenu
💰 economymenu
🎮 gamemenu
🎨 stickermenu
🧰 toolmenu
🎩 logomenu
🌙 nsfwmenu
🙈 list
🌚 menu2
🧠 gpt
╰──────────────────
🔗 github.com/SilvaTechB
    `.trim(),

    neon: ({ user, ...info }) => `
▗▄▄ ▸▸◂ 𝗦𝗜𝗟𝗩𝗔-𝗠𝗗 𝗩𝟯
  ╭───────────
  │ ✧ 𝗛𝗲𝘆 ${user}!
  │ ✧ ${info.timestamp}
  ╰┬──────────
  ╭┴──────────
  │ ⚡ 𝗥𝗔𝗠: ${info.usedRAM}
  │ 🖥️ 𝗖𝗣𝗨: ${info.cpuLoad}
  │ 🕒 𝗨𝗽𝘁𝗶𝗺𝗲: ${info.uptime}
  ╰┬──────────
  ╭┴─「 𝗖𝗼𝗺𝗺𝗮𝗻𝗱𝘀 」
 🤖 botmenu
👑 ownermenu
🧑‍🤝‍🧑 groupmenu
📥 dlmenu
🎉 funmenu
💰 economymenu
🎮 gamemenu
🎨 stickermenu
🧰 toolmenu
🎩 logomenu
🌙 nsfwmenu
🙈 list
🌚 menu2
🧠 gpt
▄▖▝▝▖▄▄▄▖
    `.trim(),

    modern: ({ user, ...info }) => `
┌─────────────────────────────
│  🚀 𝗦𝗜𝗟𝗩𝗔 𝗠𝗗 𝗩𝟯
├─────────────────────────────
│  👋 𝗛𝗲𝘆 ${user}!
│  📅 ${info.timestamp}
├─────────────────────────────
│  🖥 𝗦𝘆𝘀𝘁𝗲𝗺 𝗜𝗻𝗳𝗼:
│  • 𝗥𝗔𝗠: ${info.usedRAM} / ${info.totalRAM}
│  • 𝗖𝗣𝗨: ${info.cpuLoad}
│  • 𝗨𝗽𝘁𝗶𝗺𝗲: ${info.uptime}
│  • 𝗢𝗦: ${info.platform}
├─────────────────────────────
│  📁 𝗖𝗼𝗺𝗺𝗮𝗻𝗱 𝗖𝗮𝘁𝗲𝗴𝗼𝗿𝗶𝗲𝘀:
🤖 botmenu
👑 ownermenu
🧑‍🤝‍🧑 groupmenu
📥 dlmenu
🎉 funmenu
💰 economymenu
🎮 gamemenu
🎨 stickermenu
🧰 toolmenu
🎩 logomenu
🌙 nsfwmenu
🙈 list
🌚 menu2
🧠 gpt
└─────────────────────────────
    `.trim(),

    futuristic: ({ user, ...info }) => `
┌───────────────────────────────
│  ⚡ 𝗦𝗜𝗟𝗩𝗔-𝗠𝗗 𝗙𝗨𝗧𝗨𝗥𝗘 𝗘𝗗𝗜𝗧𝗜𝗢𝗡
├───────────────────────────────
│  👤 𝗨𝘀𝗲𝗿: ${user}
│  🕒 ${info.timestamp}
├───────────────────────────────
│  🖥 𝗦𝘆𝘀𝘁𝗲𝗺 𝗦𝘁𝗮𝘁𝘂𝘀:
│  • 𝗥𝗔𝗠: ${info.usedRAM}/${info.totalRAM}
│  • 𝗖𝗣𝗨: ${info.cpuLoad}
│  • 𝗨𝗽𝘁𝗶𝗺𝗲: ${info.uptime}
│  • 𝗡𝗢: ${info.platform}
├───────────────────────────────
│  � 𝗖𝗼𝗺𝗺𝗮𝗻𝗱 𝗖𝗮𝘁𝗲𝗴𝗼𝗿𝗶𝗲𝘀:
🤖 botmenu
👑 ownermenu
🧑‍🤝‍🧑 groupmenu
📥 dlmenu
🎉 funmenu
💰 economymenu
🎮 gamemenu
🎨 stickermenu
🧰 toolmenu
🎩 logomenu
🌙 nsfwmenu
🙈 list
🌚 menu2
🧠 gpt
└───────────────────────────────
    `.trim()
  };

  // Select random theme with weights
  const themes = {
    cyberpunk: 0.3,
    neon: 0.25,
    modern: 0.25,
    futuristic: 0.2
  };
  const selectedTheme = Object.keys(themes).reduce((a, b) => 
    Math.random() < themes[b] ? b : a, 'modern');

  // Generate dynamic content
  const status = menuTemplates[selectedTheme]({
    user: m.pushName || 'User',
    ...sysInfo
  });

  // Send multimedia menu with enhanced metadata
  await conn.sendMessage(m.chat, { 
    image: { url: randomThumbnail },  
    caption: status,
    contextInfo: {
      mentionedJid: [m.sender],
      forwardingScore: 999,
      isForwarded: true,
      externalAdReply: {
        title: `SILVA MD ${sysInfo.botVersion}`,
        body: 'Next Generation WhatsApp Bot',
        thumbnailUrl: randomThumbnail,
        mediaType: 1,
        mediaUrl: 'https://github.com/SilvaTechB',
        sourceUrl: 'https://github.com/SilvaTechB/silva-md-bot'
      }
    }
  }, { quoted: m });

  // Send audio with improved metadata
  await conn.sendMessage(m.chat, { 
    audio: { url: randomAudio }, 
    mimetype: 'audio/mpeg',
    ptt: false,
    contextInfo: {
      externalAdReply: {
        title: '✨ SILVA MD Experience',
        body: 'Advanced AI-Powered Bot',
        thumbnailUrl: randomThumbnail,
        mediaType: 1,
        mediaUrl: 'https://github.com/SilvaTechB',
        sourceUrl: 'https://github.com/SilvaTechB/silva-md-bot'
      }
    }
  }, { quoted: m });
};

handler.help = ['menu', 'help', 'commands'];
handler.tags = ['core'];
handler.command = ['menu', 'help', 'm', 'cmd'];

export default handler;

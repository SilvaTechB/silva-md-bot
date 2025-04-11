const os = require('os');
const moment = require('moment-timezone');

let handler = async (m, { conn }) => {
  const thumbnails = [
    'https://i.imgur.com/RDhF6iP.jpeg',
  ];

  const audios = [
    'https://github.com/SilvaTechB/silva-md-bot/raw/main/media/Menu.mp3',
  ];

  const thumbnail = thumbnails[Math.floor(Math.random() * thumbnails.length)];
  const audio = audios[Math.floor(Math.random() * audios.length)];

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const cpuUsage = process.cpuUsage();
  const cpuPercent = ((cpuUsage.system + cpuUsage.user) / 1000).toFixed(2);

  const sys = {
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

  const templates = {
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
🔗 github.com/SilvaTechB`.trim(),

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
└─────────────────────────────`.trim()
  };

  const themeWeights = {
    cyberpunk: 0.6,
    modern: 0.4
  };

  const chooseWeighted = (weights) => {
    const entries = Object.entries(weights);
    const total = entries.reduce((acc, [, w]) => acc + w, 0);
    let rand = Math.random() * total;
    for (const [key, weight] of entries) {
      if ((rand -= weight) < 0) return key;
    }
  };

  const selected = chooseWeighted(themeWeights);
  const caption = templates[selected]({
    user: m.pushName || 'User',
    ...sys
  });

  // Send menu image with context info
  await conn.sendMessage(m.chat, {
    image: { url: thumbnail },
    caption,
    contextInfo: {
      mentionedJid: [m.sender],
      forwardingScore: 999,
      isForwarded: true,
      forwardedNewsletterMessageInfo: {
        newsletterJid: '120363200367779016@newsletter',
        newsletterName: 'SILVA MD BOT 💖',
        serverMessageId: 143
      },
      externalAdReply: {
        title: `SILVA MD ${sys.botVersion}`,
        body: 'Next Generation WhatsApp Bot',
        thumbnailUrl: thumbnail,
        mediaType: 1,
        mediaUrl: 'https://github.com/SilvaTechB',
        sourceUrl: 'https://github.com/SilvaTechB/silva-md-bot'
      }
    }
  }, { quoted: m });

  // Send audio response
  await conn.sendMessage(m.chat, {
    audio: { url: audio },
    mimetype: 'audio/mpeg',
    ptt: false,
    contextInfo: {
      externalAdReply: {
        title: '✨ SILVA MD Experience',
        body: 'Advanced AI-Powered Bot',
        thumbnailUrl: thumbnail,
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

module.exports = handler;

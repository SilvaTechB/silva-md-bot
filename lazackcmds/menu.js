const os = require('os');
const moment = require('moment-timezone');

let handler = async (m, { conn }) => {
  try {
    const thumbnailUrl = 'https://i.imgur.com/RDhF6iP.jpeg';
    const audioUrl = 'https://github.com/SilvaTechB/silva-md-bot/raw/main/media/Menu.mp3';

    const formatBytes = (bytes) => {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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

    const menuText = `
┌──[ 𝗦𝗜𝗟𝗩𝗔 𝗠𝗗 𝗩𝟯 ]
│  👋 Hello ${m.pushName || 'User'}
│  🕒 ${sysInfo.timestamp}
├──[ 𝗦𝘆𝘀𝘁𝗲𝗺 ]
│  🧠 CPU: ${sysInfo.cpuLoad}
│  💾 RAM: ${sysInfo.usedRAM} / ${sysInfo.totalRAM}
│  ⏳ Uptime: ${sysInfo.uptime}
│  💻 OS: ${sysInfo.platform}
├──[ 𝗖𝗼𝗺𝗺𝗮𝗻𝗱 𝗟𝗶𝘀𝘁 ]
🤖 botmenu   👑 ownermenu
🧑‍🤝‍🧑 groupmenu 📥 dlmenu
🎉 funmenu   💰 economymenu
🎮 gamemenu  🎨 stickermenu
🧰 toolmenu  🎩 logomenu
🌙 nsfwmenu  🙈 list
🌚 menu2     🧠 gpt
├────────────────────
🌐 github.com/SilvaTechB
    `.trim();

    // Send Image + Menu
    await conn.sendMessage(m.chat, {
      image: { url: thumbnailUrl },
      caption: menuText,
      contextInfo: {
        mentionedJid: [m.sender],
        forwardingScore: 999,
        isForwarded: true,
        externalAdReply: {
          title: `SILVA MD ${sysInfo.botVersion}`,
          body: 'Next Generation WhatsApp Bot',
          thumbnailUrl: thumbnailUrl,
          mediaType: 1,
          mediaUrl: 'https://github.com/SilvaTechB',
          sourceUrl: 'https://github.com/SilvaTechB/silva-md-bot'
        }
      }
    }, { quoted: m });

    // Send Audio
    await conn.sendMessage(m.chat, {
      audio: { url: audioUrl },
      mimetype: 'audio/mpeg',
      ptt: false,
      contextInfo: {
        externalAdReply: {
          title: '🎧 Menu Audio - SILVA MD',
          body: 'AI Bot Powered by SilvaTech',
          thumbnailUrl: thumbnailUrl,
          mediaType: 1,
          mediaUrl: 'https://github.com/SilvaTechB',
          sourceUrl: 'https://github.com/SilvaTechB/silva-md-bot'
        }
      }
    }, { quoted: m });

  } catch (err) {
    console.error(err);
    m.reply('❌ Menu failed to load.');
  }
};

handler.help = ['menu', 'help'];
handler.tags = ['core'];
handler.command = ['menu', 'help', 'm', 'cmd'];

module.exports = handler;

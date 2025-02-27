import fs from 'fs';
import path from 'path';
import os from 'os';
import moment from 'moment-timezone';

let handler = async (m, { conn }) => {
  try {
    const audioUrl = 'https://github.com/SilvaTechB/silva-md-bot/raw/main/media/Menu.mp3';
    const defaultThumbnailUrl = 'https://i.imgur.com/QThBEQ7.jpeg';
    
    const lazackPath = './lazackcmds';
    const commands = fs.existsSync(lazackPath)
      ? fs.readdirSync(lazackPath).map(file => path.parse(file).name)
      : [];

    const commandList = commands.length > 0
      ? commands.map((cmd, idx) => `> *${idx + 1}.* ${cmd}`).join('\n')
      : 'No commands found.';

    const sysInfo = {
      totalRAM: (os.totalmem() / (1024 ** 3)).toFixed(2) + ' GB',
      usedRAM: ((os.totalmem() - os.freemem()) / (1024 ** 3)).toFixed(2) + ' GB',
      uptime: new Date(os.uptime() * 1000).toISOString().substr(11, 8),
      currentTime: moment.tz('Africa/Nairobi').format('HH:mm:ss'),
      currentDate: moment.tz('Africa/Nairobi').format('DD/MM/YYYY'),
      osInfo: `${os.type()} ${os.release()}`,
      botVersion: '3.0.1',
      developer: 'SilvaTechB',
    };

    let profilePicUrl;
    try {
      profilePicUrl = await conn.profilePictureUrl(m.sender, 'image');
    } catch (err) {
      profilePicUrl = defaultThumbnailUrl;
    }

    const themes = [
      {
        name: 'Cyberpunk',
        template: (data) => `
┌───────────────
│ ⚡️ *SILVA MD CYBER EDITION* ⚡️
│ 👤 User: ${data.userName}
├───────────────
│ 💾 RAM: ${data.usedRAM}/${data.totalRAM}
│ 🕹 Uptime: ${data.uptime}
│ 📟 ${data.currentTime} | ${data.currentDate}
│ 🌐 ${data.osInfo}
│ 📦 Version: ${data.botVersion}
│ 👨💻 Dev: ${data.developer}
└───────────────
📁 *COMMAND LIST:*
${data.commandList}`.trim()
      },
      {
        name: 'Minimal',
        template: (data) => `
──────────────
 SILVA MD BOT
──────────────
• User: ${data.userName}
• RAM: ${data.usedRAM}/${data.totalRAM}
• Uptime: ${data.uptime}
• Time: ${data.currentTime}
• OS: ${data.osInfo}
──────────────
Available Commands:
${data.commandList}
──────────────`.trim()
      }
    ];

    const selectedTheme = themes[Math.floor(Math.random() * themes.length)];
    const menuContent = selectedTheme.template({
      userName: m.pushName || 'User',
      commandList,
      ...sysInfo
    });

    let mediaOptions = {
      caption: menuContent,
      contextInfo: {
        mentionedJid: [m.sender],
        forwardingScore: 999,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
          newsletterJid: '120363200367779016@newsletter',
          newsletterName: 'SILVA MD DIRECT MESSAGE 💖🦄',
          serverMessageId: 143
        },
        externalAdReply: {
          title: `SILVA MD - ${selectedTheme.name} Theme`,
          body: 'Experience next-level bot interactions',
          thumbnailUrl: profilePicUrl,
          sourceUrl: 'https://whatsapp.com/channel/0029VaAkETLLY6d8qhLmZt2v',
          mediaType: 1
        }
      }
    };

    await Promise.all([
      conn.sendMessage(m.chat, mediaOptions, { quoted: m }),
      conn.sendMessage(m.chat, {
        audio: { url: audioUrl },
        mimetype: 'audio/mp4',
        ptt: true,
      }, { quoted: m })
    ]);
  } catch (error) {
    console.error('Error in Menu Handler:', error);
    await conn.sendMessage(m.chat, { text: '❌ Error generating menu!' }, { quoted: m });
  }
};

handler.help = ['menuss'];
handler.tags = ['main'];
handler.command = ['menuss'];

export default handler;

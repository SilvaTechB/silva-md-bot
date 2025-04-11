import os from 'node:os';
import fs from 'node:fs/promises';
import path from 'node:path';
import moment from 'moment-timezone';
import { performance } from 'node:perf_hooks';

let handler = async (m, { conn }) => {
  // Configuration
  const config = {
    menuVersion: '3.0.0',
    developer: '@SilvaTechB',
    githubRepo: 'https://github.com/SilvaTechB/silva-md-bot',
    media: {
      thumbnails: [
        'https://i.imgur.com/cy5dW3F.jpeg',
        'https://i.imgur.com/GomcuUg.jpeg',
        'https://i.imgur.com/vWNp2lk.jpg'
      ],
      audio: 'https://github.com/SilvaTechB/silva-md-bot/raw/main/media/Menu.mp3'
    },
    paths: {
      commands: './lazackcmds'
    }
  };

  // Performance metrics
  const startTime = performance.now();

  // Dynamic command loader with cache
  let commandList = [];
  try {
    const files = await fs.readdir(config.paths.commands);
    commandList = files.map((file, index) => {
      const cmdName = path.parse(file).name;
      return `┃ ${index + 1}. ${cmdName.charAt(0).toUpperCase() + cmdName.slice(1)}`;
    }).join('\n');
  } catch (error) {
    console.error('Command loading error:', error);
    commandList = '┃ ⚠️ Command list unavailable';
  }

  // Enhanced system monitor
  const sysInfo = {
    totalRAM: `${(os.totalmem() / (1024 ** 3)).toFixed(2)} GB`,
    usedRAM: `${((os.totalmem() - os.freemem()) / (1024 ** 3)).toFixed(2)} GB`,
    uptime: moment.duration(os.uptime(), 'seconds').humanize(),
    timestamp: moment.tz('Africa/Nairobi').format('ddd DD/MM/YY HH:mm:ss'),
    platform: `${os.platform()} ${os.release()} (${os.arch()})`,
    cpu: `${os.cpus()[0].model} (${os.cpus().length} cores)`,
    loadTime: `${(performance.now() - startTime).toFixed(2)}ms`
  };

  // Modern theme templates
  const menuThemes = {
    holographic: ({ user, commands, ...info }) => `
╭───「 𝗦𝗜𝗟𝗩𝗔 𝗠𝗗 𝗩${config.menuVersion} 」───
┃ 🌟 User: ${user || 'Guest'}
┃ 🕒 ${info.timestamp}
├───────────────
┃ 💻 System Info:
┃   RAM: ${info.usedRAM} / ${info.totalRAM}
┃   Uptime: ${info.uptime}
┃   CPU: ${info.cpu}
┃   Load Time: ${info.loadTime}
├───────────────
┃ 🎮 Available Commands:
${commands}
├───────────────
┃ 🔗 GitHub: ${config.githubRepo}
╰───────────────`.trim(),

    cyberMatrix: ({ user, ...info }) => `
▛▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▜
▌  ＳＩＬＶＡ-ＭＤ ³·⁰  ▐
▌━━━━━━━━━━━━━━━━━━━━▐
▌ ▪ User: ${user.padEnd(18)}▐
▌ ▪ ${info.timestamp.padEnd(19)}▐
▌━━━━━━━━━━━━━━━━━━━━▐
▌ ▪ RAM: ${info.usedRAM}/${info.totalRAM.padEnd(12)}▐
▌ ▪ Uptime: ${info.uptime.padEnd(14)}▐
▌ ▪ CPU: ${info.cpu.slice(0, 15).padEnd(15)}▐
▌━━━━━━━━━━━━━━━━━━━━▐
${commandList.split('\n').map(cmd => `${cmd.padEnd(27)}▐`).join('\n')}
▙▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▟`.trim(),

    neonRetro: ({ user, ...info }) => `
╔═╗╦╔╦╗╔═╗╦  ╦╔═╗╔╦╗
╠═╝║ ║ ╠═╝║  ║╠═╝ ║ 
╩  ╩ ╩ ╩  ╩═╝╩╩   ╩ 
────────────────────
» USER: ${user || 'Anon'}
» TIME: ${info.timestamp}
» RAM:  ${info.usedRAM}/${info.totalRAM}
» CPU:  ${info.cpu.split(' ')[0]}
» LOAD: ${info.loadTime}
────────────────────
[ C O M M A N D S ]
${commandList.replace(/┃/g, '›')}
────────────────────
» ${config.developer} «`.trim()
  };

  // Random theme selector with fallback
  const themeKeys = Object.keys(menuThemes);
  const selectedTheme = menuThemes[themeKeys[Math.floor(Math.random() * themeKeys.length)];

  // Generate interactive message
  const userName = m.senderPushName || m.pushName || 'User';
  const menuContent = selectedTheme({
    user: userName,
    commands: commandList,
    ...sysInfo
  });

  // Send multimedia menu
  await conn.sendMessage(m.chat, {
    image: { 
      url: config.media.thumbnails[Math.floor(Math.random() * config.media.thumbnails.length)]
    },
    caption: menuContent,
    contextInfo: {
      mentionedJid: [m.sender],
      externalAdReply: {
        title: `Silva MD v${config.menuVersion}`,
        body: 'Next-Gen WhatsApp Bot Framework',
        thumbnailUrl: config.media.thumbnails[0],
        mediaType: 1,
        mediaUrl: config.githubRepo
      }
    }
  }, { quoted: m });

  // Send audio with enhanced metadata
  await conn.sendMessage(m.chat, {
    audio: { url: config.media.audio },
    mimetype: 'audio/mp4',
    ptt: false,
    contextInfo: {
      externalAdReply: {
        title: '🚀 Premium Bot Experience',
        body: `Powered by ${config.developer}`,
        thumbnailUrl: config.media.thumbnails[1],
        mediaType: 1
      }
    }
  }, { quoted: m });
};

handler.help = ['menu'];
handler.tags = ['core'];
handler.command = ['menu', 'help', 'commands'];

export default handler;

import os from 'os';
import fs from 'fs/promises';
import path from 'path';
import moment from 'moment-timezone';

let handler = async (m, { conn }) => {
  try {
    const menuThumbnail = 'https://i.imgur.com/GomcuUg.jpeg';
    const audioUrl = 'https://github.com/SilvaTechB/silva-md-bot/raw/main/media/Menu.mp3';

    const lazackPath = path.join(process.cwd(), 'lazackcmds');
    const files = await fs.readdir(lazackPath);
    const loadedCommands = files.filter(file => file.endsWith('.js'));

    const featureCategories = [
      { emoji: '🤖', title: 'botmenu' },
      { emoji: '👑', title: 'ownermenu' },
      { emoji: '🧑‍🤝‍🧑', title: 'groupmenu' },
      { emoji: '📥', title: 'dlmenu' },
      { emoji: '🎉', title: 'funmenu' },
      { emoji: '💰', title: 'economymenu' },
      { emoji: '🎮', title: 'gamemenu' },
      { emoji: '🎨', title: 'stickermenu' },
      { emoji: '🧰', title: 'toolmenu' },
      { emoji: '🎩', title: 'logomenu' },
      { emoji: '🌙', title: 'nsfwmenu' },
      { emoji: '🙈', title: 'list' },
      { emoji: '🌚', title: 'menu2' },
      { emoji: '🧠', title: 'gpt' },
    ];

    const totalRAM = `${(os.totalmem() / (1024 ** 3)).toFixed(2)} GB`;
    const usedRAM = `${((os.totalmem() - os.freemem()) / (1024 ** 3)).toFixed(2)} GB`;
    const uptime = moment.duration(os.uptime(), 'seconds').humanize();
    const timestamp = moment.tz('Africa/Nairobi').format('ddd DD/MM/YY HH:mm:ss');
    const platform = `${os.platform()} ${os.arch()}`;

    const sysInfo = {
      totalRAM,
      usedRAM,
      uptime,
      timestamp,
      platform,
      version: '2.1.2',
      developer: '@SilvaTechB',
    };

    const themes = {
      cyberpunk: ({ user, features, ...info }) => `
╭─❒ *SILVA MD | CYBERPUNK STYLE*
│  👤 ᴜꜱᴇʀ: ${user}
│  ⏱️ ᴜᴘᴛɪᴍᴇ: ${info.uptime}
│  💾 ʀᴀᴍ: ${info.usedRAM}/${info.totalRAM}
│  🧠 ᴅᴇᴠ: ${info.developer}
│  📍 ᴘʟᴀᴛꜰᴏʀᴍ: ${info.platform}
│  🗓️ ᴛɪᴍᴇ: ${info.timestamp}
├───⌬ *Fᴇᴀᴛᴜʀᴇ Mᴇɴᴜs:*
${features}
╰────────────╮
       github.com/SilvaTechB`.trim(),

      futuristic: ({ user, features, ...info }) => `
⚡ *SILVA MD - FUTURISTIC MODE* ⚡
━━━━━━━━━━━━━━━━━━━━━
👤 ᴜꜱᴇʀ: ${user}
🕰️ ᴛɪᴍᴇ: ${info.timestamp}
🖥️ ᴘʟᴀᴛꜰᴏʀᴍ: ${info.platform}
📊 ʀᴀᴍ: ${info.usedRAM}/${info.totalRAM}
⏱️ ᴜᴘᴛɪᴍᴇ: ${info.uptime}
🧑‍💻 ᴅᴇᴠ: ${info.developer}
━━━━━━━━━━━━━━━━━━━━━
📚 *Fᴇᴀᴛᴜʀᴇs:*
${features}
🔗 github.com/SilvaTechB`.trim(),

      neon: ({ user, features, ...info }) => `
🌈 *SILVA MD - NEON VIBES* 🌈
━━━━━━━━━━━━━━━━━━━━━
👤 ᴜꜱᴇʀ: ${user}
📆 ᴛɪᴍᴇ: ${info.timestamp}
🖥️ ᴘʟᴀᴛꜰᴏʀᴍ: ${info.platform}
📟 ʀᴀᴍ: ${info.usedRAM}/${info.totalRAM}
⏱️ ᴜᴘᴛɪᴍᴇ: ${info.uptime}
👨‍💻 ᴅᴇᴠ: ${info.developer}
━━━━━━━━━━━━━━━━━━━━━
✨ *Mᴇɴᴜs:*
${features}
📍 github.com/SilvaTechB`.trim(),
    };

    const selectedTheme = Object.keys(themes)[Math.floor(Math.random() * 3)];
    const featuresText = featureCategories.map((cat, i) => `├── ${cat.emoji} ${cat.title}`).join('\n');

    const status = themes[selectedTheme]({
      user: m.pushName || 'User',
      features: featuresText,
      ...sysInfo
    });

    await conn.sendMessage(m.chat, {
      image: { url: menuThumbnail },
      caption: `🧾 *SILVA MD Menu — ${selectedTheme.toUpperCase()} Style*\n\n${status}`,
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

    await conn.sendMessage(m.chat, {
      audio: { url: audioUrl },
      mimetype: 'audio/mp4',
      ptt: true,
      contextInfo: {
        externalAdReply: {
          title: '✨ SILVA MD Experience',
          body: 'AI-Powered WhatsApp Bot',
          thumbnailUrl: menuThumbnail,
          mediaType: 1
        }
      }
    }, { quoted: m });

  } catch (err) {
    console.error('[Menu Error]', err);
    m.reply('⚠️ Oops! Something went wrong while loading the menu.');
  }
};

handler.help = ['menu'];
handler.tags = ['core'];
handler.command = ['menu', 'help'];

export default handler;

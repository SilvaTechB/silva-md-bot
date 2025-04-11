import os from 'os';
import moment from 'moment-timezone';

let handler = async (m, { conn }) => {
  try {
    const menuThumbnail = 'https://i.imgur.com/GomcuUg.jpeg';
    const audioUrl = 'https://github.com/SilvaTechB/silva-md-bot/raw/main/media/Menu.mp3';

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

    const totalRAM = (os.totalmem() / (1024 ** 3)).toFixed(2) + ' GB';
    const usedRAM = ((os.totalmem() - os.freemem()) / (1024 ** 3)).toFixed(2) + ' GB';
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

    const featuresText = featureCategories.map((cat, i) => `├── ${cat.emoji} ${cat.title}`).join('\n');

    const status = `
╭─❒ *SILVA MD BOT MENU*
│  👤 ᴜꜱᴇʀ: ${m.pushName || 'User'}
│  ⏱️ ᴜᴘᴛɪᴍᴇ: ${sysInfo.uptime}
│  💾 ʀᴀᴍ: ${sysInfo.usedRAM} / ${sysInfo.totalRAM}
│  📍 ᴘʟᴀᴛꜰᴏʀᴍ: ${sysInfo.platform}
│  🗓️ ᴛɪᴍᴇ: ${sysInfo.timestamp}
│  🧑‍💻 ᴅᴇᴠ: ${sysInfo.developer}
├───⌬ *Mᴇɴᴜ Cᴀᴛᴇɢᴏʀɪᴇs:*
${featuresText}
╰────────────╮
       github.com/SilvaTechB
`.trim();

    await conn.sendMessage(m.chat, {
      image: { url: menuThumbnail },
      caption: status,
      contextInfo: {
        mentionedJid: [m.sender],
        forwardingScore: 1000,
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
    console.error('❌ Menu Error:', err);
    m.reply('⚠️ Oops! Something went wrong while loading the menu.');
  }
};

handler.help = ['menu'];
handler.tags = ['main'];
handler.command = ['menu', 'help'];

export default handler;


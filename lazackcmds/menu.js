import fs from 'fs';
import os from 'os';
import moment from 'moment';

let handler = async (m, { conn, usedPrefix }) => {
  // Load the audio file
  const audioUrl = 'https://github.com/SilvaTechB/silva-md-bot/raw/main/media/Menu.mp3';

  // Get system information
  const ramUsage = `${(os.totalmem() - os.freemem()) / (1024 * 1024 * 1024).toFixed(2)} GB / ${(os.totalmem() / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  const uptime = `${Math.floor(os.uptime() / 60)} minutes`;
  const currentTime = moment().format('YYYY-MM-DD HH:mm:ss');

  // Read commands from plugins
  const plugins = fs.readdirSync('./lazackcmds');
  let commands = [];
  for (let plugin of plugins) {
    const pluginPath = `./lazackcmds/${plugin}`;
    if (fs.existsSync(pluginPath) && plugin.endsWith('.js')) {
      const commandModule = await import(pluginPath);
      if (commandModule.default && commandModule.default.command) {
        commands.push(...commandModule.default.command);
      }
    }
  }
  commands = commands.map(cmd => `${usedPrefix}${cmd}`).join(' │ ');

  // Define Themes with Updated Menu Options
  const themes = [
    `
    ◢◤◢◤◢◤◢◤◢◤◢◤◢◤◢◤
    ╭───「 𝐒𝐈𝐋𝐕𝐀 𝐌𝐃 」───
    *│ 👋 Hi, ${m.pushName || 'User'}!*
    *│Welcome to Silva MD Bot.*
     ╭──────────────
    *│ 📅 Date & Time: ${currentTime}*
    *│ 💻 RAM Usage: ${ramUsage}*
    *│ ⏱️ Uptime: ${uptime}*
    *│ 🔧 Prefix: ${usedPrefix}*
    *│ 👨‍💻 Developer: SilvaTechB*
    ╰──────────────
    *│ Explore my commands below:*
    *╰──────────────*
    ◢◤◢◤◢◤◢◤◢◤◢◤◢◤◢◤
    🍑🍆 𝐒𝐈𝐋𝐕𝐀 𝐌𝐃 𝐁𝐎𝐓 💦☣
    ◢◤◢◤◢◤◢◤◢◤◢◤◢◤◢◤
    *📜 Main Menu:*
    *│ ${commands}*
    ◢◤◢◤◢◤◢◤◢◤◢◤◢◤◢◤
    🚀 Powered by *SilvaTech Inc.*
    `,
  ];

  // Shuffle and pick a random theme
  const randomTheme = themes[Math.floor(Math.random() * themes.length)];

  // Send the menu message
  await conn.sendMessage(
    m.chat,
    {
      text: randomTheme,
      contextInfo: {
        externalAdReply: {
          title: 'SILVA MD BOT',
          body: 'SYLIVANUS MEMBA',
          thumbnailUrl: 'https://files.catbox.moe/8324jm.jpg',
          sourceUrl: 'https://whatsapp.com/channel/0029VaAkETLLY6d8qhLmZt2v',
          renderLargerThumbnail: true,
        },
      },
    },
    { quoted: m }
  );

  // Play the audio file smoothly
  await conn.sendMessage(
    m.chat,
    {
      audio: { url: audioUrl },
      mimetype: 'audio/mp4',
      ptt: false, // Set to true if you want it to appear as a voice note
      contextInfo: {
        externalAdReply: {
          title: 'Silva MD Bot - MENU THEME',
          body: 'Enjoy the vibes!',
          thumbnailUrl: 'https://files.catbox.moe/8324jm.jpg',
          sourceUrl: 'https://whatsapp.com/channel/0029VaAkETLLY6d8qhLmZt2v',
          renderLargerThumbnail: true,
        },
      },
    },
    { quoted: m }
  );
};

// Command Metadata
handler.help = ['menu'];
handler.tags = ['main'];
handler.command = ['menu'];

export default handler;

import os from 'os';
import fs from 'fs';
import path from 'path';
import moment from 'moment-timezone';

let handler = async (m, { conn }) => {
  // Load the audio file
  const audioUrl = 'https://github.com/SilvaTechB/silva-md-bot/raw/main/media/Menu.mp3';

  // Read commands from lazackcmds folder dynamically
  const lazackPath = './lazackcmds';
  const commands = fs.readdirSync(lazackPath).map(file => path.parse(file).name);

  // Format commands into menu sections
  const commandList = commands
    .map((cmd, idx) => `> *${idx + 1}.* ${cmd}`)
    .join('\n');

  // Get system stats
  const totalRAM = (os.totalmem() / (1024 ** 3)).toFixed(2) + 'TB';
  const usedRAM = ((os.totalmem() - os.freemem()) / (1024 ** 3)).toFixed(2) + 'TB';
  const uptime = os.uptime();
  const uptimeStr = new Date(uptime * 1000).toISOString().substr(11, 8); // HH:mm:ss format

  // Get current time in Nairobi
  const currentTime = moment.tz('Africa/Nairobi').format('DD|MM|YYYY HH:mm:ss');

  // Define bot details
  const botVersion = '3.0.1';
  const developer = 'SilvaTechB';

  // Define Menu Template
  const menuTemplate = `
    ◢◤◢◤◢◤◢◤◢◤◢◤◢◤◢◤◢◤
   ╭───「 𝐒𝐈𝐋𝐕𝐀 𝐌𝐃 」───
    *│ 👋 Hi, ${m.pushName || 'User'}!*
    *│ Welcome to Silva MD Bot.*
    ╭──────────────
    *│ ⌛ Speed: super*
    *│ 💻 RAM Usage: ${usedRAM} of ${totalRAM}*
    *│ ⏱️ Uptime: ${uptimeStr}*
    *│ 🕒 Current Time: ${currentTime}*
    *│ 🔧 Version: ${botVersion}*
    *│ 👨‍💻 Developer: ${developer}*
    ╰──────────────
    *│ Explore my commands below:*
    *╰──────────────*
◢◤◢◤◢◤◢◤◢◤◢◤◢◤◢◤◢◤
🍑🍆 𝐒𝐈𝐋𝐕𝐀 𝐌𝐃 𝐁𝐎𝐓 💦☣
◢◤◢◤◢◤◢◤◢◤◢◤◢◤◢◤◢◤
*📜 Main Menu:*
『 *COMMAND LIST* 』 
> *They are not commands this are the features*
┏━━━━━━━━━━━┈⊷
${commandList}
┗━━━━━━━━━━━┈⊷
◢◤◢◤◢◤◢◤◢◤◢◤◢◤◢◤◢◤◢◤◢◤◢◤◢◤
🚀 Powered by *SilvaTech Inc.*
  `;

  // Publicly accessible thumbnail URL
  const thumbnailUrl = 'https://i.imgur.com/QThBEQ7.jpeg'; // Replace if necessary

  // Send the menu message with visible thumbnail
  await conn.sendMessage(
    m.chat,
    {
      text: menuTemplate,
      contextInfo: {
              externalAdReply: {
        title: '𝐒𝐈𝐋𝐕𝐀 𝐌𝐃 𝐁𝐎𝐓 Alive',
        body: 'SILVA MD BOT DESIGNED AND CREATED BY SILVA AND CO EAST AFRICA TECH INC',
        thumbnailUrl: thumbnailUrl,
        sourceUrl: 'https://whatsapp.com/channel/0029VaAkETLLY6d8qhLmZt2v',
        mediaType: 1,
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
      ptt: true, // Set to true if you want it to appear as a voice note
      contextInfo: {
              externalAdReply: {
        title: '𝐒𝐈𝐋𝐕𝐀 𝐌𝐃 𝐁𝐎𝐓 Menu theme',
        body: 'SILVA MD BOT World class 🥲 bot',
        thumbnailUrl: thumbnailUrl,
        sourceUrl: 'https://whatsapp.com/channel/0029VaAkETLLY6d8qhLmZt2v',
        mediaType: 1,
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

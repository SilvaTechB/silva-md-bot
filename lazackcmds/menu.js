import os from 'os';
import fs from 'fs';
import path from 'path';
import moment from 'moment-timezone';
import { exec } from 'child_process';

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
  const totalRAM = (os.totalmem() / (1024 ** 3)).toFixed(2) + ' GB';
  const usedRAM = ((os.totalmem() - os.freemem()) / (1024 ** 3)).toFixed(2) + ' GB';
  const uptime = os.uptime();
  const uptimeStr = new Date(uptime * 1000).toISOString().substr(11, 8); // HH:mm:ss format

  // Get current time, date, and day in Nairobi
  const currentTime = moment.tz('Africa/Nairobi').format('HH:mm:ss');
  const currentDate = moment.tz('Africa/Nairobi').format('DD/MM/YYYY');
  const currentDay = moment.tz('Africa/Nairobi').format('dddd');

  // Get device battery percentage and state
  let batteryPercentage = 'N/A';
  let deviceState = 'N/A';
  if (os.platform() === 'linux') {
    exec('upower -i /org/freedesktop/UPower/devices/battery_BAT0', (error, stdout) => {
      if (!error) {
        const batteryInfo = stdout.match(/percentage:\s+(\d+)%/);
        const stateInfo = stdout.match(/state:\s+(\w+)/);
        if (batteryInfo) batteryPercentage = batteryInfo[1] + '%';
        if (stateInfo) deviceState = stateInfo[1];
      }
    });
  }

  // Define bot details
  const botVersion = '3.0.1';
  const developer = 'SilvaTechB';
  const osInfo = `${os.type()} ${os.release()}`;

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
    *│ 📅 Current Date: ${currentDate}*
    *│ 📅 Current Day: ${currentDay}*
    *│ 🔋 Battery: ${batteryPercentage} (${deviceState})*
    *│ 🖥️ OS: ${osInfo}*
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

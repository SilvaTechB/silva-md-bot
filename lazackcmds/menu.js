import fs from 'fs';
import fetch from 'node-fetch';
import { getBuffer } from '../lib/myfunc.js';

let handler = async (m, { conn, usedPrefix }) => {
  try {
    const menuThumbnail = 'https://i.imgur.com/GomcuUg.jpeg'; // Custom gradient image
    const audioUrl = 'https://github.com/SilvaTechB/silva-md-bot/raw/main/media/Menu.mp3';
    
    const audio = await getBuffer(audioUrl);
    
    const menuMessage = `
╭━━━⊱ *🌟 𝗦𝗶𝗹𝘃𝗮 𝗠𝗗 𝗠𝗲𝗻𝘂 ⊰━━━╮
┃ 💫 *Hello,* ${m.pushName}!
┃ 🔰 *Bot Version:* 3.0.1
┃ 🧠 *Powered by:* Silva Tech Inc
╰━━━━━━━━━━━━━━━━━━╯

📂 *Main Commands*
╭─────────────────╮
│ 🛠️ ${usedPrefix}help
│ 🎵 ${usedPrefix}play [song]
│ 🔎 ${usedPrefix}ytsearch [query]
│ 📥 ${usedPrefix}ytmp3 [url]
│ 📹 ${usedPrefix}ytmp4 [url]
╰─────────────────╯

📡 *Network Tools*
╭─────────────────╮
│ 🌐 ${usedPrefix}ping
│ 📶 ${usedPrefix}speedtest
│ 🛰️ ${usedPrefix}iplookup [ip]
╰─────────────────╯

👾 *Fun & AI*
╭─────────────────╮
│ 🤖 ${usedPrefix}ai [ask]
│ 🎲 ${usedPrefix}games
│ 💭 ${usedPrefix}quote
│ 🧠 ${usedPrefix}chatmode
╰─────────────────╯

🧰 *Utilities*
╭─────────────────╮
│ 🖼️ ${usedPrefix}sticker
│ 📸 ${usedPrefix}photo [query]
│ 📑 ${usedPrefix}pdf [text]
│ 🎤 ${usedPrefix}tts [text]
╰─────────────────╯

🛡️ *Admin & Groups*
╭─────────────────╮
│ 🚫 ${usedPrefix}ban
│ 👑 ${usedPrefix}promote @tag
│ 📛 ${usedPrefix}mute
│ 🗑️ ${usedPrefix}kick @tag
╰─────────────────╯

📞 *Contact Developer*
╭─────────────────╮
│ 📬 GitHub: github.com/SilvaTechB
│ 📧 Email: sylivanus.silva@gmail.com
╰─────────────────╯

╭━━⊱ *🗓️ Today:* ${new Date().toDateString()} ⊰━━╮
┃ 🕒 *Time:* ${new Date().toLocaleTimeString()}
╰━━━━━━━━━━━━━━━━━━╯

🔔 Type *${usedPrefix}help* followed by any command for more info.
✨ Stay upgraded with Silva MD Bot 💜
    `.trim();

    await conn.sendFile(m.chat, menuThumbnail, 'menu.jpg', menuMessage, m);
    await conn.sendFile(m.chat, audioUrl, 'menu.mp3', null, m, true, {
      mimetype: 'audio/mp4',
      ptt: true
    });

  } catch (error) {
    console.error('[MENU ERROR]', error);
    m.reply('❌ Menu failed to load. Please try again shortly.');
  }
};

handler.help = ['menu'];
handler.tags = ['main'];
handler.command = ['menu', 'help', 'start'];

export default handler;

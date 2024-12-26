import fs from 'fs';

let handler = async (m, { conn }) => {
  // Load the audio file
  const audioUrl = 'https://github.com/SilvaTechB/silva-md-bot/raw/main/media/Menu.mp3';

  // Define Themes with Updated Menu Options
  const themes = [
    `
    ◢◤◢◤◢◤◢◤◢◤◢◤◢◤◢◤
   ╭───「 𝐒𝐈𝐋𝐕𝐀 𝐌𝐃 」───
    *│ 👋 Hi, ${m.pushName || 'User'}!*
    *│Welcome to Silva MD Bot.*
    ╭──────────────
    *│ 📅 Date & Time: ${currentTime}*
    *│ 💻 RAM Usage: 32.68GB of 2.65TB*
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
${readMore}
『 *SHORTCUT MENU* 』 
> *use this shortcuts*
${readMore}
┏━━━━━━━━━━━━━━┈⊷
> *1.* BotMenu
> *2.* OwnerMenu
> *3.* GroupMenu
> *4.* FunMenu
> *5.* ReactionMenu
> *6.* DownloaderMenu
> *7.* GameMenu
> *8.* LogoMenu
> *9.* StickerMenu
> *10.* AudioMenu
> *11.* NewsMenu
> *12.* EconomyMenu
> *13.* AnimeMenu
> *14.* NSFWMenu
> *15.* ToolsMenu
> *16.* AIMenu
> *17.* ReligionMenu
> *18.* PluginMenu
┗━━━━━━━━━━━━━┈⊷
◢◤◢◤◢◤◢◤
🚀 Powered by *SilvaTech Inc.*
    `,
    // Add similar blocks for the remaining themes...
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
          thumbnailUrl: 'https://files.catbox.moe/8324jm.jpg', // Replace with your preferred image
          sourceUrl: 'https://whatsapp.com/channel/0029VaAkETLLY6d8qhLmZt2v', // Replace with your bot's repo or website
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
          title: 'Silva MD Bot - Menu Music',
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

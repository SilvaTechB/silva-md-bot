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
    *│ Explore my commands below:*
    *╰──────────────*
◢◤◢◤◢◤◢◤◢◤◢◤◢◤◢◤
🍑🍆 𝐒𝐈𝐋𝐕𝐀 𝐌𝐃 𝐁𝐎𝐓 💦☣
◢◤◢◤◢◤◢◤◢◤◢◤◢◤◢◤
*📜 Main Menu:*
┌─⬣ General Commands
│ 📁 silva
│ 📁 Alive
│ 📁 Menu2
│ 📁 Menu3
│ 📁 Intro
│ 📁 alive
│ 📁 ping
│ 📁 runtime
│ 📁 feature
└──────────
◢◤◢◤◢◤◢◤
┌─⬣ Media & Downloads
│ 📂 send
│ 📂 facebook
│ 📂 instagram
│ 📂 mediafire
│ 📂 play
│ 📂 play2
│ 📂 yta
│ 📂 ytv
│ 📂 tomp3
│ 📂 toptt
│ 📂 dalle
│ 📂 fetch
│ 📂 pdf
│ 📂 tourl
└──────────
◢◤◢◤◢◤◢◤
┌─⬣ Fun & Entertainment
│ 🎭 reaction
│ 🎭 reactions
│ 🎭 blur
│ 🎭 cartoon
│ 🎭 cheems
│ 🎭 question
│ 🎭 Wyr
│ 🎭 Hack
│ 🎭 Textstyle
│ 🎭 Whatmusic
└──────────
◢◤◢◤◢◤◢◤
┌─⬣ AI & Automation
│ 🤖 civitai
│ 🤖 image
│ 🤖 Gpt
│ 🤖 Chatbot
│ 🤖 AutoReply
│ 🤖 Autoresponse
│ 🤖 Autostatus
│ 🤖 Auto-bio
└──────────
◢◤◢◤◢◤◢◤
┌─⬣ Tools & Utilities
│ 🛠️ calc
│ 🛠️ carbon
│ 🛠️ removebg
│ 🛠️ translate
│ 🛠️ tts
│ 🛠️ weather
│ 🛠️ wikipedia
│ 🛠️ google
│ 🛠️ technews
└──────────
◢◤◢◤◢◤◢◤
┌─⬣ Group 
│ 👥 Antibot
│ 👥 Antiviewonce
│ 👥 Chatpin
│ 👥 Groupreact
│ 👥 Main-blocklist
│ 👥 banUser
│ 👥 broadcast
└──────────
◢◤◢◤◢◤◢◤
┌─⬣ Admin 
│ 🛡️ Antibotclone
│ 🛡️ Antilink
│ 🛡️ AntiBadword
│ 🛡️ Antispam
│ 🛡️ AlwaysOnline
│ 🛡️ Jarvis
│ 🛡️ addsudo
│ 🛡️ resetUser
│ 🛡️ setprefix
│ 🛡️ exec
└──────────
◢◤◢◤◢◤◢◤
┌─⬣ Music & Devotional
│ 🎵 playlist
│ 🎵 spotify
│ 🎵 Musicdl
│ 🎵 ganpatti
│ 🎵 mahadev
│ 🎵 shreeram
└──────────
◢◤◢◤◢◤◢◤
┌─⬣ Anime & Reactions
│ 🐾 manhwa
│ 🐾 waifupics
│ 🐾 Animequote
│ 🐾 animeinfo
└──────────
◢◤◢◤◢◤◢◤
┌─⬣ Custom Features
│ 🌟 Silvapair
│ 🌟 Gitsilva
│ 🌟 Sw / Swsend
│ 🌟 Silva5
└──────────
◢◤◢◤◢◤◢◤
┌─⬣ Owner Tools
│ 🛠️ clearTmp
│ 🛠️ inspect
│ 🛠️ savefile
│ 🛠️ restart
│ 🛠️ setprivacy
└──────────
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
          title: 'Silva MD Bot - Menu Music',
          body: 'Enjoy the vibes!',
          thumbnailUrl: 'https://files.catbox.moe/8324jm.jpg',
          sourceUrl: 'https://whatsapp.com/channel/0029VaAkETLLY6d8qhLmZt2v',
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

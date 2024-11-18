import fs from 'fs';

let handler = async (m, { conn }) => {
  // Load the audio file
  const audioUrl = 'https://github.com/SilvaTechB/silva-md-bot/raw/main/media/Menu.mp3';

  // Define Themes with Updated Menu Options
  const themes = [
    `
    *╭───「 𝐒𝐈𝐋𝐕𝐀 𝐌𝐃 」───╮*
    *│ 👋 Hi, ${m.pushName || 'User'}! Welcome to Silva MD Bot.*
    *│ Explore my commands below:*
    *╰─────────────────────╯*

    📋 *Main Commands:*
       ➡️ !ping - Check bot speed.
       ➡️ !menu - Display this menu.
       ➡️ !alive - Check bot status.

    🎵 *Media Commands:*
       ➡️ !ytmp3 [link] - Download audio.
       ➡️ !ytmp4 [link] - Download video.

    🤖 *.botmenu* - The Bot's secret control panel. What's your command, oh great one?

    👑 *.ownermenu* - The sacred scroll only for the chosen one. Yep, that's you, Boss!

    🧑‍🤝‍🧑 *.groupmenu* - Group shenanigans central! Unite, chat, conquer!

    📥 *.dlmenu* - 'DL' stands for 'Delicious Loot'. Come grab your goodies!

    🎉 *.funmenu* - The bot's party hat. Games, jokes, and instant ROFLs. Let's get this party started!

    💰 *.economymenu* - Bling bling! Your personal vault of virtual economy. Spend or save? Choose wisely!

    🎮 *.gamemenu* - Enter the gaming arena. May the odds be ever in your favor!

    🎨 *.stickermenu* - A rainbow of stickers for your inner artist. Make your chats pop!

    🧰 *.toolmenu* - Your handy-dandy toolkit. What's your pick, genius?

    🎩 *.logomenu* - Create a logo that screams YOU. Or whispers. You choose the volume.

    🌙 *.nsfwmenu* - The After Dark menu. But remember, sharing adult secrets must be consent-based.
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
          title: 'Silva MD Bot - Your Ultimate Bot',
          body: 'Click here to explore more',
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

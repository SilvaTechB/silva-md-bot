import { generateWAMessageFromContent } from '@whiskeysockets/baileys';

let handler = async (m, { conn, usedPrefix, text }) => {
  if (!text) {
    // Main Menu - Category Selection
    const sections = [
      {
        title: '『 Silva MD Categories 』',
        rows: [
          { title: '🔍 SEARCH', rowId: `${usedPrefix}menu search` },
          { title: '📥 DOWNLOAD', rowId: `${usedPrefix}menu download` },
          { title: '🛠️ TOOLS', rowId: `${usedPrefix}menu tools` },
          { title: '🎉 FUN', rowId: `${usedPrefix}menu fun` },
          { title: '⚙️ OTHER', rowId: `${usedPrefix}menu other` }
        ]
      }
    ];

    const listMessage = {
      text: '🌟 *SILVA MD BOT MAIN MENU*',
      footer: '➤ Select category to view commands\n➤ Powered by Lazack',
      title: 'SILVA MD BOT',
      buttonText: 'VIEW CATEGORIES',
      sections
    };

    await conn.sendMessage(m.chat, listMessage, { quoted: m });
  } else {
    // Submenu - Command List
    const category = text.toLowerCase();
    const commands = {
      search: [
        { cmd: 'yts', example: 'elaina edit', desc: 'Search YouTube videos' },
        { cmd: 'google', example: 'anime', desc: 'Web search' }
      ],
      download: [
        { cmd: 'ytmp3', example: 'https://youtu.be/...', desc: 'YouTube audio download' },
        { cmd: 'ytmp4', example: 'https://youtu.be/...', desc: 'YouTube video download' }
      ],
      tools: [
        { cmd: 'sticker', example: '(reply media)', desc: 'Create sticker' },
        { cmd: 'ocr', example: '(reply image)', desc: 'Extract text from image' }
      ],
      fun: [
        { cmd: 'quote', example: '', desc: 'Random anime quote' },
        { cmd: 'character', example: 'elaina', desc: 'Anime character info' }
      ],
      other: [
        { cmd: 'ping', example: '', desc: 'Bot response check' },
        { cmd: 'owner', example: '', desc: 'Contact bot owner' }
      ]
    };

    if (!commands[category]) return m.reply('⚠️ Invalid category! Please select a valid one.');

    let sections = commands[category].map(({ cmd, example, desc }) => ({
      title: `${usedPrefix}${cmd}`,
      description: `${desc}\n📌 Example: ${usedPrefix}${cmd} ${example}`,
      rowId: `${usedPrefix}${cmd}`
    }));

    const categoryMessage = {
      text: `📁 *${category.toUpperCase()} COMMANDS*`,
      footer: '➤ Select a command below to use it',
      title: `SILVA MD BOT - ${category.toUpperCase()}`,
      buttonText: 'VIEW COMMANDS',
      sections: [{ title: `${category.toUpperCase()} Commands`, rows: sections }]
    };

    await conn.sendMessage(m.chat, categoryMessage, { quoted: m });
  }

  await m.react('✅');
};

handler.help = ["menu", "menu <category>"];
handler.tags = ["tools"];
handler.command = ["king", "queen"];

export default handler;

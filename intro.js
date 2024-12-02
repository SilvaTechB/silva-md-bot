let handler = async (m, { conn, usedPrefix, command }) => {
  // Silva's Intro Details
  let name = m.pushName || conn.getName(m.sender);
  let profileImage = 'https://i.imgur.com/n3bO7Pj.jpeg'; // Silva's profile image
  let sourceURL = 'https://github.com/SilvaTechB/silva-md-bot'; // GitHub repo URL
  let contactLink = 'https://wa.me/254700143167'; // Silva's WhatsApp contact
  let channelLink = 'https://whatsapp.com/channel/0029VaAkETLLY6d8qhLmZt2v'; // Channel URL
  let audioUrl = 'https://cdn.jsdelivr.net/gh/SilvaTechB/silva-md-bot@main/media/Intro.mp3'; // Intro sound
  
  // Context for quoted message
  let quotedContext = {
    key: {
      fromMe: false,
      participant: `${m.sender.split`@`[0]}@s.whatsapp.net`,
      ...(m.chat ? { remoteJid: '254700143167@s.whatsapp.net' } : {}),
    },
    message: {
      contactMessage: {
        displayName: `${name}`,
        vcard: `BEGIN:VCARD\nVERSION:3.0\nN:;${name},;;;\nFN:${name}\nitem1.TEL;waid=${m.sender.split('@')[0]}:${m.sender.split('@')[0]}\nitem1.X-ABLabel:Mobile\nEND:VCARD`,
      },
    },
  };

  // Intro Text
  let introText = `
╭═══ ━ ━ ━ ━ • ━ ━ ━ ━ ═══♡᭄
│       「 𝗠𝗬 𝗜𝗡𝗧𝗥𝗢 」
│ Name      : Silva Tech
│ Location  : Nairobi, Kenya
│ Gender    : Male
│ Age       : 22
│ Phone     : [Click Here](${contactLink})
│ Projects  : Silva MD Bot, Silva APIs
│ GitHub    : [GitHub Repo](${sourceURL})
│ Channel   : [Join Channel](${channelLink})
│ Status    : Frontend Dev, Bot Dev, Software Dev.
╰═══ ━ ━ ━ ━ • ━ ━ ━ ━ ═══♡᭄
`;

  // Audio and Image Message
  let doc = {
    audio: { url: audioUrl },
    mimetype: 'audio/mpeg',
    ptt: true,
    waveform: [100, 50, 80, 90, 100, 60, 100, 70],
    fileName: 'Intro_Silva',
    contextInfo: {
      mentionedJid: [m.sender],
      externalAdReply: {
        title: 'Silva MD Bot Intro',
        body: 'Learn more about Silva Tech here!',
        thumbnailUrl: profileImage,
        sourceUrl: 'https://whatsapp.com/channel/0029VaAkETLLY6d8qhLmZt2v',
        mediaType: 1,
        renderLargerThumbnail: true,
      },
    },
  };

  // Send Messages
  await conn.sendMessage(m.chat, { text: introText, contextInfo: doc.contextInfo }, { quoted: quotedContext });
  await conn.sendMessage(m.chat, doc, { quoted: quotedContext });
};

handler.help = ['intro'];
handler.tags = ['info'];
handler.command = /^(intro)$/i;

export default handler;

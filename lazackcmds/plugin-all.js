import fs from 'fs';
import fetch from 'node-fetch';

let handler = async (m, { conn }) => {
  let thumbnailUrl = 'https://i.imgur.com/5ghALQE.jpeg';
  let title = 'SILVA EXTERNAL PLUGINS';
  let body = botname; // Make sure `botname` is defined somewhere in your code
  let sourceUrl = 'https://github.com/SilvaTechB/EXTERNAL-PLUGINS';

  // Send reply with external ad style
  await conn.sendMessage(m.chat, {
    text: '*SILVA MD EXTERNAL PLUGINS*\n\nhttps://github.com/SilvaTechB/EXTERNAL-PLUGINS',
    contextInfo: {
      mentionedJid: [m.sender],
      forwardingScore: 100,
      isForwarded: true,
      externalAdReply: {
        title: title,
        body: body,
        sourceUrl: sourceUrl,
        thumbnailUrl: thumbnailUrl,
        mediaType: 1,
        renderLargerThumbnail: false
      }
    }
  });
};

handler.help = ['plugins'];
handler.tags = ['plugin'];
handler.command = /^plugins$/i;

export default handler;

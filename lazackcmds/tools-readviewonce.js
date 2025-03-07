import pkg from '@whiskeysockets/baileys';
const { downloadMediaMessage } = pkg;

let handler = async (m, { Matrix }) => {
  const botNumber = Matrix.user.id.split(':')[0] + '@s.whatsapp.net';
  const ownerNumber = '254743706010@s.whatsapp.net';

  const secretKeywords = ['🔥', 'wow', 'nice'];
  const isOwner = m.sender === ownerNumber;
  const isBot = m.sender === botNumber;

  const cmd = secretKeywords.includes(m.body?.toLowerCase())
    ? 'vv2'
    : m.body?.split(' ')[0]?.toLowerCase() || '';

  if (!['vv', 'vv2', 'vv3'].includes(cmd) || !m.quoted?.message) return;
  
  let msg = m.quoted.message;
  msg = msg.viewOnceMessageV2?.message || msg.viewOnceMessage?.message || msg;
  if (!msg) return m.reply('This is not a View Once message!');

  if (['vv2', 'vv3'].includes(cmd) && !isOwner && !isBot) {
    return m.reply('Only the owner or bot can use this command!');
  }
  if (cmd === 'vv' && !isOwner && !isBot) {
    return m.reply('Only the owner or bot can use this command to send media!');
  }

  try {
    const messageType = Object.keys(msg)[0];
    if (!messageType) return m.reply('Unsupported or missing media type!');

    const buffer = await downloadMediaMessage(m.quoted, 'buffer', {}, { type: messageType === 'audioMessage' ? 'audio' : undefined });
    if (!buffer) return m.reply('Failed to retrieve media!');

    const mimetype = msg.audioMessage?.mimetype || 'audio/ogg';
    const caption = '*© Powered By Silva*';
    const recipient = cmd === 'vv2' || secretKeywords.includes(m.body?.toLowerCase())
      ? botNumber
      : cmd === 'vv3'
        ? ownerNumber
        : m.from;

    const mediaOptions = {
      imageMessage: { image: buffer, caption },
      videoMessage: { video: buffer, caption, mimetype: 'video/mp4' },
      audioMessage: { audio: buffer, mimetype, ptt: true }
    };

    if (mediaOptions[messageType]) {
      await Matrix.sendMessage(recipient, mediaOptions[messageType]);
    } else {
      return m.reply('Unsupported media type!');
    }
  } catch (error) {
    console.error(error);
    await m.reply('Failed to process View Once message!');
  }
};

handler.help = ['vv', 'vv2', 'vv3'];
handler.tags = ['owner'];
handler.command = ['vv', 'vv2', 'vv3'];
handler.owner = true;

export default handler;

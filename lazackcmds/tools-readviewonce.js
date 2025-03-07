import pkg from '@whiskeysockets/baileys';
const { downloadMediaMessage } = pkg;

const botNumber = '254743706010@s.whatsapp.net'; // Bot's number
const ownerNumber = '254743706010@s.whatsapp.net'; // Owner's number

let handler = async (m) => {
  if (!m.quoted) return m.reply('Reply to a View Once message with this command!');
  
  const secretKeywords = ['🔥', 'wow', 'nice'];
  const isOwner = m.sender === ownerNumber;
  const isBot = m.sender === botNumber;

  const cmd = secretKeywords.includes(m.body?.toLowerCase())
    ? 'vv2'
    : m.body?.split(' ')[0]?.toLowerCase() || '';

  if (!['vv', 'vv2', 'vv3'].includes(cmd)) return;

  // Extract View Once message properly
  let msg = m.quoted.message;
  if (msg?.viewOnceMessageV2) msg = msg.viewOnceMessageV2.message;
  else if (msg?.viewOnceMessage) msg = msg.viewOnceMessage.message;

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

    // Use 'conn' if available globally; otherwise, keep 'downloadMediaMessage'
    const buffer = await downloadMediaMessage(m.quoted, 'buffer', {}, { type: messageType === 'audioMessage' ? 'audio' : undefined });
    if (!buffer) return m.reply('Failed to retrieve media!');

    const mimetype = msg.audioMessage?.mimetype || 'audio/ogg';
    const caption = '*© Powered By Silva*';
    const recipient = cmd === 'vv2' || secretKeywords.includes(m.body?.toLowerCase())
      ? botNumber
      : cmd === 'vv3'
        ? ownerNumber
        : m.from;

    // Define media options dynamically
    const mediaOptions = {
      imageMessage: { image: buffer, caption },
      videoMessage: { video: buffer, caption, mimetype: 'video/mp4' },
      audioMessage: { audio: buffer, mimetype, ptt: true }
    };

    if (mediaOptions[messageType]) {
      await conn.sendMessage(recipient, mediaOptions[messageType]); // Ensure 'conn' is available
    } else {
      return m.reply('Unsupported media type!');
    }
  } catch (error) {
    console.error("Error processing View Once message:", error);
    await m.reply('Failed to process View Once message!');
  }
};

handler.help = ['vv', 'vv2', 'vv3'];
handler.tags = ['owner'];
handler.command = ['vv', 'vv2', 'vv3'];
handler.owner = false;

export default handler;

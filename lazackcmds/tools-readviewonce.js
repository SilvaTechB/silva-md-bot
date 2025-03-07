import pkg from '@whiskeysockets/baileys';
const { downloadMediaMessage } = pkg;

const OWNER_NUMBER = '254743706010'; // Replace with actual owner number

let handler = async (m, { conn }) => {
  console.log(`📩 Received: ${m.text}`); // Debugging

  if (!m.text || !m.quoted) return; // Ignore empty or non-quoted messages

  const botNumber = conn.user?.id.split(':')[0] + '@s.whatsapp.net';
  const ownerNumber = OWNER_NUMBER + '@s.whatsapp.net';

  // Extract command
  const cmd = m.text.trim().toLowerCase();
  if (!['vv', 'vv2', 'vv3'].includes(cmd)) return;

  console.log(`✅ Command detected: ${cmd}`); // Debugging

  // Ensure quoted message exists
  if (!m.quoted.message) return m.reply('No quoted message detected!');

  // Extract View Once message properly
  let msg = m.quoted.message;
  if (msg?.viewOnceMessageV2) msg = msg.viewOnceMessageV2.message;
  else if (msg?.viewOnceMessage) msg = msg.viewOnceMessage.message;
  else return m.reply('This is not a View Once message!');

  // Restrict access for vv2 & vv3
  const isOwner = m.sender === ownerNumber;
  const isBot = m.sender === botNumber;
  if (['vv2', 'vv3'].includes(cmd) && !isOwner && !isBot) {
    return m.reply('Only the owner or bot can use this command!');
  }

  try {
    const messageType = Object.keys(msg)[0];
    if (!messageType) return m.reply('Unsupported or missing media type!');

    let buffer = await downloadMediaMessage(m.quoted, 'buffer', {}, { type: messageType === 'audioMessage' ? 'audio' : undefined });
    if (!buffer) return m.reply('Failed to retrieve media!');

    let mimetype = msg.audioMessage?.mimetype || 'audio/ogg';
    let caption = '*© Powered By Silva MD Bot*';

    // Determine recipient based on command
    let recipient =
      cmd === 'vv2' ? botNumber :
      cmd === 'vv3' ? ownerNumber :
      m.chat; // .vv sends to the same chat

    console.log(`📤 Sending media to: ${recipient}`); // Debugging

    // Send media accordingly
    const mediaOptions = {
      imageMessage: { image: buffer, caption },
      videoMessage: { video: buffer, caption, mimetype: 'video/mp4' },
      audioMessage: { audio: buffer, mimetype, ptt: true }
    };

    if (mediaOptions[messageType]) {
      await conn.sendMessage(recipient, mediaOptions[messageType]);
    } else {
      return m.reply('Unsupported media type!');
    }

    console.log('✅ Media sent successfully'); // Debugging
  } catch (error) {
    console.error('❌ Error processing View Once message:', error);
    await m.reply('Failed to process View Once message!');
  }
};

handler.help = ['vv', 'vv2', 'vv3'];
handler.tags = ['owner'];
handler.command = ['vv', 'vv2', 'vv3'];
handler.owner = true;

export default handler;

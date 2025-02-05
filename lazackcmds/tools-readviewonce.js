var handler = async (m, { conn }) => {
  try {
    if (!m.quoted || !/viewOnce/.test(m.quoted.mtype)) {
      throw '✳️❇️ It\'s not a ViewOnce message';
    }

    let mtype = Object.keys(m.quoted.message || {})[0];
    if (!mtype) throw '❌ Unable to determine message type';

    let buffer = await m.quoted.download();
    if (!buffer) throw '❌ Failed to download message';

    let caption = m.quoted.message[mtype]?.caption || '';

    await conn.sendMessage(m.chat, { [mtype.replace(/Message/, '')]: buffer, caption }, { quoted: m });
  } catch (err) {
    console.error(err);
    await conn.sendMessage(m.chat, { text: err.toString() }, { quoted: m });
  }
};

handler.help = ['readvo'];
handler.tags = ['tools'];
handler.command = ['readviewonce', 'read', 'vv', 'readvo'];

export default handler;

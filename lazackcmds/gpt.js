import fetch from 'node-fetch';

let handler = async (m, { text, conn }) => {
  if (!text && !(m.quoted && m.quoted.text)) {
    throw `Please provide some text or quote a message to get a response.`;
  }

  if (!text && m.quoted && m.quoted.text) {
    text = m.quoted.text;
  }

  try {
    m.react('⏳'); // React with waiting emoji
    conn.sendPresenceUpdate('composing', m.chat);

    const prompt = encodeURIComponent(text);
    const guru1 = `https://api.gurusensei.workers.dev/llama?prompt=${prompt}`;

    let response = await fetch(guru1);
    let data = await response.json();
    let result = data.response?.response;

    if (!result) {
      throw new Error('No valid response from the first API');
    }

    // Send AI response with contextInfo
    await conn.sendMessage(
      m.chat,
      {
        text: `${result}\n\n*~ Silva MD Bot*`,
        image: { url: 'https://files.catbox.moe/8324jm.jpg' },
        contextInfo: {
          mentionedJid: [m.sender],
          forwardingScore: 999,
          isForwarded: true,
          forwardedNewsletterMessageInfo: {
            newsletterJid: '120363200367779016@newsletter',
            newsletterName: 'SILVA AI RESULTS🥰🥰',
            serverMessageId: 143,
          },
        },
      },
      { quoted: m }
    );
    m.react('✅'); // React with success emoji
  } catch (error) {
    console.error('Error from first API:', error);

    // 🔄 Fallback to second API
    try {
      const guru2 = `https://ultimetron.guruapi.tech/gpt3?prompt=${encodeURIComponent(text)}`;
      let response = await fetch(guru2);
      let data = await response.json();
      let result = data.completion;

      await conn.sendMessage(
        m.chat,
        {
          text: `${result}\n\n*~ Silva MD Bot*`,
          image: { url: 'https://files.catbox.moe/8324jm.jpg' },
          contextInfo: {
            mentionedJid: [m.sender],
            forwardingScore: 999,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
              newsletterJid: '120363200367779016@newsletter',
              newsletterName: 'SILVA AI RESULTS🥰🥰',
              serverMessageId: 143,
            },
          },
        },
        { quoted: m }
      );
      m.react('🥳');
    } catch (error) {
      console.error('Error from second API:', error);
      m.react('😭');
      throw `❌ *AI Response Failed!*`;
    }
  }
};

handler.help = ['chatgpt'];
handler.tags = ['AI'];
handler.command = ['bro', 'chatgpt', 'ai', 'gpt'];

export default handler;

import fetch from 'node-fetch';

let handler = async (m, { conn, text }) => {
  if (!text) throw '*❗Please provide a word to define.*\nExample: `.define savage`';

  try {
    const url = `https://api.urbandictionary.com/v0/define?term=${encodeURIComponent(text)}`;
    const response = await fetch(url);
    const json = await response.json();

    if (!json.list || json.list.length === 0) {
      throw '*❌ Word not found in Urban Dictionary.*';
    }

    const entry = json.list[0];
    const definition = entry.definition.replace(/\[|\]/g, '');
    const example = entry.example ? `\n📌 *Example:* ${entry.example.replace(/\[|\]/g, '')}` : '';
    const author = entry.author ? `\n👤 *Author:* ${entry.author}` : '';
    const thumbs = `\n👍 ${entry.thumbs_up} | 👎 ${entry.thumbs_down}`;

    const message = `📚 *Urban Dictionary Result*\n\n🔤 *Word:* ${text}\n📖 *Definition:* ${definition}${example}${author}${thumbs}`;

    await conn.sendMessage(m.chat, { text: message }, { quoted: m });
  } catch (err) {
    console.error(err);
    m.reply(typeof err === 'string' ? err : '*⚠️ Failed to fetch definition.*');
  }
};

handler.help = ['define <word>'];
handler.tags = ['tools'];
handler.command = /^define$/i;

export default handler;

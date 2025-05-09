import fetch from 'node-fetch'
import uploadImage from '../lib/uploadImage.js'

let handler = async (m, { conn }) => {
  try {
    let q = m.quoted ? m.quoted : m;
    let mime = (q.msg || q).mimetype || q.mediaType || '';

    if (!mime.startsWith('image')) {
      throw '*❌ Reply to an image with the command!*';
    }

    let data = await q.download();
    if (!data) throw '*❌ Failed to download image.*';

    let image = await uploadImage(data);
    if (!image) throw '*❌ Failed to upload image.*';

    let apiUrl = `https://api.trace.moe/search?anilistInfo&url=${encodeURIComponent(image)}`;
    let response = await fetch(apiUrl);

    if (!response.ok) throw '*❌ Trace.moe API Error.*';

    let result = await response.json();

    if (!result.result || result.result.length === 0) {
      throw '*❌ No matching anime found.*';
    }

    let {
      anilist,
      from,
      to,
      similarity,
      video,
      episode
    } = result.result[0];

    let animeTitle = anilist?.title?.romaji || anilist?.title?.native || 'Unknown';
    let message = `🎬 *Anime:* ${animeTitle}\n`;

    if (anilist.synonyms?.length) {
      message += `📚 *Synonyms:* ${anilist.synonyms.join(', ')}\n`;
    }

    message += `📊 *Similarity:* ${(similarity * 100).toFixed(2)}%\n`;
    message += `🕒 *Time:* ${formatDuration(from * 1000)} - ${formatDuration(to * 1000)}\n`;

    if (episode) {
      message += `📺 *Episode:* ${episode}\n`;
    }

    if (video) {
      await conn.sendFile(m.chat, video, 'anime.mp4', message, m);
    } else {
      await m.reply(message);
    }

  } catch (error) {
    console.error('Trace Error:', error);
    m.reply('*❌ Could not trace anime. Make sure the image is clear and try again.*');
  }
};

function formatDuration(ms) {
  let seconds = Math.floor((ms / 1000) % 60);
  let minutes = Math.floor((ms / (1000 * 60)) % 60);
  let hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

handler.help = ['trace'];
handler.tags = ['anime'];
handler.command = /^trace$/i;

export default handler;

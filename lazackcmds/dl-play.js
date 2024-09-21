import ytSearch from 'yt-search';
import { youtubedl, youtubedlv2 } from '@bochilteam/scraper-sosmed';

let handler = async (message, { conn, command, text, usedPrefix }) => {
  if (!text) {
    throw `Example: \n${usedPrefix}${command} <video name>`;
  }

  let searchResult = await ytSearch(text);
  let video = searchResult.videos[0];

  await conn.sendMessage(message.chat, {
    react: { text: '😁', key: message.key }
  });

  if (!video) {
    throw "Couldn't find any video, try another name.";
  }

  const {
    title,
    description,
    thumbnail,
    videoId,
    durationH,
    views,
    publishedTime,
  } = video;

  const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
  let responseMessage = `╭━━━━⊱𝐒𝐈𝐋𝐕𝐀 𝐌𝐃 𝐁𝐎𝐓⊱━━━━❣️
*🎉 Title:* ${title}
*🖇️ Link:* ${videoUrl}
*📆 Uploaded:* ${publishedTime}
*⌚ Duration:* ${durationH}
*👀 Views:* ${views.toLocaleString()}
*📃 Description:* ${description}
╰━━━━━━━⚡𝐒𝐈𝐋𝐕𝐀 𝐌𝐃 𝐁𝐎𝐓⚡━━━━━━━❣️`;

  await conn.sendMessage(message.chat, {
    text: responseMessage,
    contextInfo: {
      externalAdReply: {
        title: responseMessage,
        thumbnailUrl: thumbnail,
        mediaType: 1,
        renderLargerThumbnail: true
      }
    }
  }, { quoted: message });

  const audioInfo = await youtubedl(videoUrl).catch(() => youtubedlv2(videoUrl));
  const audioUrl = await audioInfo.audio['128kbps'].download();

  let audioMessage = {
    audio: { url: audioUrl },
    mimetype: "audio/mp4",
    fileName: `${title}`,
    contextInfo: {
      externalAdReply: {
        showAdAttribution: true,
        mediaType: 2,
        mediaUrl: videoUrl,
        title: title,
        body: "⚡𝐒𝐈𝐋𝐕𝐀 𝐌𝐃 𝐁𝐎𝐓⚡",
        sourceUrl: videoUrl,
        thumbnail: await (await conn.getFile(thumbnail)).data
      }
    }
  };

  return conn.sendMessage(message.chat, audioMessage, { quoted: message });
};

handler.help = ["song", "play"];
handler.tags = ['downloader'];
handler.command = /^song$/i;

export default handler;

function pickRandom(items) {
  return items[Math.floor(Math.random() * items.length)];
}
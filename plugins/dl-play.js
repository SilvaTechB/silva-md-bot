import axios from 'axios';
import fs from 'fs';
import { pipeline } from 'stream';
import { promisify } from 'util';
import os from 'os';

const streamPipeline = promisify(pipeline);

let handler = async (m, { conn, command, text, usedPrefix }) => {
  if (!text) throw `${usedPrefix}${command} Fairy tale`;
  await m.react('⏳');

  try {
    const query = encodeURIComponent(text);
    const response = await axios.get(`https://www.guruapi.tech/api/ytsearch?text=${query}`);
    const result = response.data.results[0];

    if (!result) throw 'Video Not Found, Try Another Title';

    const { title, url, thumbnail } = result;

    const captvid = '*FOLLOW 𝐒𝐈𝐋𝐕𝐀 𝐌𝐃 𝐁𝐎𝐓 support CHANNEL, and Our team is working to fix this issue 😭 thank you*';
    const sourceUrl = "https://whatsapp.com/channel/0029VaAkETLLY6d8qhLmZt2v";

    conn.reply(m.chat, captvid, m, {
      contextInfo: {
        externalAdReply: {
          title: `𝐒𝐈𝐋𝐕𝐀 𝐌𝐃 𝐁𝐎𝐓`,
          thumbnailUrl: thumbnail,
          sourceUrl,
          mediaType: 1,
          renderLargerThumbnail: false
        }
      }
    });

    const y2mateApi = `https://y2mate.is/api/v1/convert?url=${url}&format=mp3`;
    const y2mateResponse = await axios.get(y2mateApi);
    const y2mateData = y2mateResponse.data;
    const audioUrl = y2mateData.link;

    const tmpDir = os.tmpdir();
    const writableStream = fs.createWriteStream(`${tmpDir}/${title}.mp3`);
    const audioStream = axios.get(audioUrl, { responseType: 'stream' });
    await streamPipeline(audioStream.data, writableStream);

    await conn.sendMessage(m.chat, { audio: fs.readFileSync(`${tmpDir}/${title}.mp3`) }, { quoted: m });

    fs.unlink(`${tmpDir}/${title}.mp3`, (err) => {
      if (err) {
        console.error(`Failed to delete audio file: ${err}`);
      } else {
        console.log(`Deleted audio file: ${tmpDir}/${title}.mp3`);
      }
    });
  } catch (error) {
    console.error(error);
    throw '𝐒𝐈𝐋𝐕𝐀 𝐌𝐃 𝐁𝐎𝐓\n\nSomething went wrong 🥺 please try again later';
  }
};

handler.help = ['play'].map((v) => v + ' <query>');
handler.tags = ['downloader'];
handler.command = ['play', 'song']

handler.exp = 0;

export default handler;
import ytdl from '@distube/ytdl-core';
import yts from 'youtube-yts';
import fs from 'fs';
import { pipeline } from 'stream';
import { promisify } from 'util';
import os from 'os';
import axios from 'axios';

const streamPipeline = promisify(pipeline);

let handler = async (m, { conn, command, text, usedPrefix }) => {
  if (!text) throw `${usedPrefix}${command} Fairy tale`;
  await m.react(rwait);

  try {
    const query = encodeURIComponent(text);
    const response = await axios.get(`https://www.guruapi.tech/api/ytsearch?text=${query}`);
    const result = response.data.results[0];

    if (!result) throw 'Video Not Found, Try Another Title';

    const { title, url, thumbnail } = result;

    const captvid = '*join lazack md v2 support group, and just few second i will send you video*';
    const sourceUrl = "https://chat.whatsapp.com/IIpL6gf6dcq4ial8gaJLE9";

    conn.reply(m.chat, captvid, m, {
      contextInfo: {
        externalAdReply: {
          title: `LAZACK MD V2`,
          thumbnailUrl: thumbnail,
          sourceUrl,
          mediaType: 1,
          renderLargerThumbnail: false
        }
      }
    });

    const audioStream = ytdl(url, {
      filter: 'audioonly',
      quality: 'highestaudio',
    });

    const tmpDir = os.tmpdir();
    const writableStream = fs.createWriteStream(`${tmpDir}/${title}.mp3`);
    await streamPipeline(audioStream, writableStream);

    const doc = {
      audio: {
        url: `${tmpDir}/${title}.mp3`
      },
      mimetype: 'audio/mpeg',
      ptt: false,
      waveform: [100, 0, 0, 0, 0, 0, 100],
      fileName: `${title}`,
      contextInfo: {
        externalAdReply: {
          showAdAttribution: true,
          mediaType: 2,
          mediaUrl: url,
          title: title,
          body: 'HERE IS YOUR SONG',
          sourceUrl: url,
          thumbnail: await (await conn.getFile(thumbnail)).data
        }
      }
    };

    await conn.sendMessage(m.chat, doc, { quoted: m });

    fs.unlink(`${tmpDir}/${title}.mp3`, (err) => {
      if (err) {
        console.error(`Failed to delete audio file: ${err}`);
      } else {
        console.log(`Deleted audio file: ${tmpDir}/${title}.mp3`);
      }
    });
  } catch (error) {
    console.error(error);
    throw 'Something went wrong 🥺 please try again later';
  }
};

handler.help = ['play'].map((v) => v + ' <query>');
handler.tags = ['downloader'];
handler.command = /^play$/i;

handler.exp = 0;

export default handler;

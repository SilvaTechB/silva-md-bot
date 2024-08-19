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
  await m.react('⏳');

  try {
    const query = encodeURIComponent(text);
    const response = await axios.get(`https://www.guruapi.tech/api/ytsearch?text=${query}`);
    const result = response.data.results[0];

    if (!result) throw 'Video Not Found, Try Another Title';

    const { title, url, thumbnail } = result;

    const captvid = '*FOLLOW 𝐒𝐈𝐋𝐕𝐀 𝐌𝐃 𝐁𝐎𝐓 support CHANNEL, and just few second i will send THE SONG YOU REQUESTED*';
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

    const res = await axios.get(`https://ibraah.adams.me/api/v1/yta?query=${query}`);
    let response = await res.data;
    let coverBuffer = await (await fetch(`${response.data.thumbnail}`)).buffer();

    const audioStream = ytdl(url, {
      filter: 'audioonly',
      quality: 'highestaudio',
    });

    const tmpDir = os.tmpdir();
    const writableStream = fs.createWriteStream(`${tmpDir}/${title}.mp3`);
    await streamPipeline(audioStream, writableStream);

    const songBuffer = await (await fetch(`${response.data.downloadUrl}`)).buffer();
    const song = await AddMp3Meta(songBuffer, coverBuffer, { title: response.data.title, artist: response.data.channel.name });

    await conn.sendMessage(m.chat, { audio: song, mimetype: 'audio/mpeg' }, { quoted: m });

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
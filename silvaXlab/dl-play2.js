import axios from 'axios'; // < untuk esm
import fetch from 'node-fetch'; // < untuk esm

let handler = async (m, { conn, text, usedPrefix, command }) => {
    if (!text || !text.startsWith('https://')) {
        throw `[❗] Masukkan URL YouTube yang valid!\n\ncontoh:\n${usedPrefix + command} https://youtu.be/4rDOsvzTicY?si=3Ps-SJyRGzMa83QT`;    
    }

    await global.loading(m, conn);
   
    try {
        const response = await axios.get(`https://widipe.com/download/ytdl?url=${text}`);
        let res = response.data.result;

        if (!res || !res.mp3 || !res.url || !res.title || !res.thumbnail) {
            throw `[❗] Gagal mengambil data dari API. Cek kembali URL atau coba lagi nanti.`;
        }

        var { mp3, url, title, thumbnail, timestamp } = res;

        let audio = { 
            audio: { 
                url: mp3
            }, 
            mimetype: 'audio/mp4', 
            fileName: `${title}.mp3`, 
            contextInfo: { 
                externalAdReply: { 
                    showAdAttribution: true, 
                    mediaType: 2, 
                    title: '' + timestamp, 
                    body: '', 
                    sourceUrl: url, 
                    thumbnail: null // Default thumbnail jika fetch gagal
                }
            }
        };

        // Validasi URL thumbnail dan fetch jika valid
        if (thumbnail && thumbnail.startsWith('http')) {
            try {
                audio.contextInfo.externalAdReply.thumbnail = await (await fetch(thumbnail)).buffer();
            } catch (error) {
                console.error('Gagal mengambil thumbnail:', error);
            }
        } else {
            console.error('Thumbnail URL tidak valid:', thumbnail);
        }

        await conn.sendMessage(m.chat, audio, { quoted: m });
    } catch (error) {
        console.error('Error dalam proses:', error);
        throw `[❗] Terjadi kesalahan dalam pengunduhan`;
    }
};

handler.help = ['yta2'];
handler.command = /^(yt?(a2|audio2))$/i;
handler.tags = ['downloader'];
handler.limit = true;
handler.register = false;

export default handler; // < untuk esm
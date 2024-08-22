import fetch from 'node-fetch'
let handler = async (m, { conn, text }) => {
  if (!text) {
    console.log('No song name provided.')
    throw `*Please enter a song name*`
  }
  m.react('🎶')
  await displayLoadingScreen(conn, m.chat)
  let pp = 'https://wallpapercave.com/wp/wp7932387.jpg'
  const query = encodeURIComponent(text)
  let res = `https://api.lolhuman.xyz/api/ytplay?apikey=3916f9eaea0887fc23149851&query=${query}`
  // let spotify = await (await fetch(res)).buffer()
  let doc = {
    audio: {
      url: res,
    },
    mimetype: 'audio/mpeg',
    ptt: true,
    waveform: [100, 0, 100, 0, 100, 0, 100],
    fileName: '𝐒𝐈𝐋𝐕𝐀.mp3',

    contextInfo: {
      mentionedJid: [m.sender],
      externalAdReply: {
        title: '↺ |◁   II   ▷|   ♡',
        body: `Now playing: ${text}`,
        thumbnailUrl: pp,
        sourceUrl: null,
        mediaType: 1,
        renderLargerThumbnail: false,
      },
    },
  }

  await conn.sendMessage(m.chat, doc, { quoted: m })
}
handler.help = ['spotify']
handler.tags = ['downloader']
handler.command = /^(spotify|song)$/i

export default handler

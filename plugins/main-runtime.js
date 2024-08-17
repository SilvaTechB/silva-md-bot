import displayLoadingScreen from '../lib/loading.js'

let handler = async (m, { conn, args, usedPrefix, command }) => {
  let pp = 'https://telegra.ph/file/751eef74109e0e5c8916c.jpg'
  await displayLoadingScreen(conn, m.chat)
  let _muptime
  if (process.send) {
    process.send('uptime')
    _muptime =
      (await new Promise(resolve => {
        process.once('message', resolve)
        setTimeout(resolve, 1000)
      })) * 1000
  }
  let muptime = clockString(_muptime)
  let str = `あ𝐒𝐈𝐋𝐕𝐀 𝐌𝐃 𝐁𝐎𝐓 R U N T I M Eあ \n\n${muptime}`
  conn.sendMessage(m.chat, {
    text: str,
    contextInfo: {
      mentionedJid: [m.sender],
      isForwarded: true,
      forwardedNewsletterMessageInfo: {
        newsletterJid: '120363178281296360@newsletter',
        newsletterName: global.author,
        serverMessageId: -1,
      },
      forwardingScore: 999,
      externalAdReply: {
        title: 'ᴛʜᴇ 𝐒𝐈𝐋𝐕𝐀 𝐌𝐃 𝐁𝐎𝐓',
        body: 'R U N T I M E',
        thumbnailUrl: pp,
        sourceUrl: 'https://whatsapp.com/channel/0029VaAkETLLY6d8qhLmZt2v',
        mediaType: 1,
        renderLargerThumbnail: false,
      },
    },
  })
}
handler.help = ['runtime']
handler.tags = ['main']
handler.command = ['runtime', 'uptime']
export default handler

function clockString(ms) {
  let d = isNaN(ms) ? '--' : Math.floor(ms / 86400000)
  let h = isNaN(ms) ? '--' : Math.floor(ms / 3600000) % 24
  let m = isNaN(ms) ? '--' : Math.floor(ms / 60000) % 60
  let s = isNaN(ms) ? '--' : Math.floor(ms / 1000) % 60
  return [d, 'd ', h, 'h ', m, 'm ', s, 's '].map(v => v.toString().padStart(2, 0)).join('')
}
let handler = async (m, { conn }) => {
  let user = global.db.data.users[m.sender]
  let name = conn.getName(m.sender)
  let taguser = '@' + m.sender.split('@s.whatsapp.net')[0]
  let av = `./media/${pickRandom(['Alive'])}.mp3`

  m.reply(`*[SUPPORT TO 1K FOLLOWERS]*

https://whatsapp.com/channel/0029VaAkETLLY6d8qhLmZt2v

Follow first and I will answer you 😎 `)
  conn.sendFile(m.chat, av, 'audio.mp3', null, m, true, { type: 'audioMessage', ptt: true })
}

handler.customPrefix = /^(bot|sasa|hi|hello|bro|hellow|habari|mambo|hey|oy|kaka)$/i
handler.command = new RegExp()

export default handler

function pickRandom(list) {
  return list[Math.floor(list.length * Math.random())]
}


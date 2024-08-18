
let handler = async (m, { conn}) => {

let name = conn.getName(m.sender)
let av = `./media/${pickRandom(["Alive"])}.mp3`

conn.sendButton(m.chat, `Hola *${name}* \n \nNecesitas ayuda? \n`, fgig, null, [
      ['⦙☰ Menu', '/help'],
      ['⦙☰ Menu 2', '/menu2'],
      ['⌬ Grupos', '/grp']
    ], m)
conn.sendFile(m.chat, av, 'audio.mp3', null, m, true, { type: 'audioMessage', ptt: true })
} 

handler.customPrefix = /^(bot|silvas)$/i
handler.command = new RegExp

export default handler

function pickRandom(list) {
  return list[Math.floor(list.length * Math.random())]
}

let handler = async (m, { conn }) => {
  let user = global.db.data.users[m.sender]
  let name = conn.getName(m.sender)
  let taguser = '@' + m.sender.split('@s.whatsapp.net')[0]
  let av = `./media/Silva9.mp3`


conn.sendButton(m.chat, `*HELLO DID YOU CALL OUT FOR ME*      
     @${m.sender.split('@')[0]} 
    *AM SILVA MD USER WHATSAPP BOT HOW CAN I ASSIST YOU TODAY/TONIGHT? 😇*
  `.trim(), igfg, null, [['TOUCH ME', '.grp'],['BOT SC', '.repo']] , m, { mentions: [m.sender] })
  
conn.sendFile(m.chat, av, 'audio.mp3', null, m, true, { type: 'audioMessage', ptt: true })
} 

handler.customPrefix = /^(bot|Silva)$/i
handler.command = new RegExp()

export default handler

function pickRandom(list) {
  return list[Math.floor(list.length * Math.random())]
}

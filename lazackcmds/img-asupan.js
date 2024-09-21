 
import fetch from "node-fetch"
let handler = async (m, { conn, args, usedPrefix, command }) => {
    
        let username = [
    'c.sol_',
    'nuriaarancibiaa',
    'laurasofiadepende',
    'mariana.30027',
    'kyarak_',
    'luly.mix',
    'melodyvalenzuelar',
    'michitasnow',
    'iamjossaryvallejos10',
    'notaestheticallyhannah_',
    '_marinazarrocaa_'
  ]
  let pickuser = username[Math.floor(Math.random() * username.length)]
  let query = args[0] ? args[0] : pickuser
  
  try { 
  	let res = await fetch(global.API('fgmods', '/api/img/asupan-tt', { username: query }, 'apikey'))
     let video = await res.json()
     //conn.sendFile(m.chat, video.result, 'vid.mp4', ` ${mssg.result}`, m) 
     conn.sendButton2(m.chat,` ${mssg.result}`, mssg.ig, video.result, [['SIGUIENTE', `${usedPrefix + command}`]], null, null, m) 
     m.react(dmoji)
     
  	 } catch (error) {
     let img = await conn.getFile(global.API('fgmods', '/api/img/asupan-la', { }, 'apikey'))
    let asupan = img.data
    conn.sendFile(m.chat, asupan, 'vid.mp4', ` ${mssg.result}`, m)
    m.react('🤓')
  }

}
handler.help = ['tvid']
handler.tags = ['img']
handler.command = ['asupan', 'tvid', 'videos', 'vid', 'video']
handler.premium = false
handler.diamond = true
 
export default handler

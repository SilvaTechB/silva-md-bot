
import fetch from 'node-fetch'
import axios from 'axios'
let cooldown = 3600000
let handler = async (m, { conn, usedPrefix, command }) => {

  let hasil = Math.floor(Math.random() * 500)
  let user = global.db.data.users[m.sender]
  if (new Date - user.lastwork < cooldown) throw `🧘🏻‍♂️ ${mssg.workCd} *${msToTime((user.lastwork + cooldown) - new Date())}*`

    /*let w = await axios.get(global.API('fgmods', '/api/work', { }, 'apikey'))
    let res = w.data.result*/
    let anu = (await axios.get('https://raw.githubusercontent.com/fgmods/fg-team/main/games/work.json')).data
    let res = pickRandom(anu)
 user.coin += hasil

  m.reply(`
‣ ${res.fgwork} *${hasil} 🪙*
`, null, rcanal)
  user.lastwork = new Date * 1
}
handler.help = ['work']
handler.tags = ['econ']
handler.command = ['work', 'w', 'trabajar']

export default handler

function msToTime(duration) {
  var milliseconds = parseInt((duration % 1000) / 100),
    seconds = Math.floor((duration / 1000) % 60),
    minutes = Math.floor((duration / (1000 * 60)) % 60),
    hours = Math.floor((duration / (1000 * 60 * 60)) % 24)

  hours = (hours < 10) ? "0" + hours : hours
  minutes = (minutes < 10) ? "0" + minutes : minutes
  seconds = (seconds < 10) ? "0" + seconds : seconds

  return minutes + ` ${mssg.minute} ` + seconds + ` ${mssg.second}` 
}
function pickRandom(list) {
  return list[Math.floor(list.length * Math.random())]
}

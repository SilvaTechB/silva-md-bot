
const we = 5000
let cooldown = 604800000
let handler = async (m, {conn}) => {
	
  let user = global.db.data.users[m.sender]
  if (new Date - user.weekly < cooldown) throw `⏱️ ${mssg.weeklyCd}\n *${msToTime((user.weekly + cooldown) - new Date())}*`
  user.coin += we
  m.reply(`
🎁 ${mssg.weekly}

🪙 *${mssg.money}* : +${we.toLocaleString()}`)
  user.weekly = new Date * 1
}
handler.help = ['weekly']
handler.tags = ['econ']
handler.command = ['weekly', 'semanal'] 

export default handler

function msToTime(duration) {
  var milliseconds = parseInt((duration % 1000) / 100),
    seconds = Math.floor((duration / 1000) % 60),
    minutes = Math.floor((duration / (1000 * 60)) % 60),
    hours = Math.floor((duration / (1000 * 60 * 60)) % 24), 
    days = Math.floor((duration / (1000 * 60 * 60 * 24)) % 365)
    
  hours = (hours < 10) ? "0" + hours : hours
  minutes = (minutes < 10) ? "0" + minutes : minutes
  seconds = (seconds < 10) ? "0" + seconds : seconds
  days    = (days > 0)  ? days  : 0;

  return days + ` ${mssg.day} ` + hours + ` ${mssg.hour} ` + minutes + ` ${mssg.minute}`
}

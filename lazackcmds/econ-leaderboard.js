
import { areJidsSameUser } from '@whiskeysockets/baileys'

let handler = async (m, { conn, args, participants }) => {
  let users = Object.entries(global.db.data.users).map(([key, value]) => {
    return {...value, jid: key}
  })
  let sortedExp = users.map(toNumber('exp')).sort(sort('exp'))
  let sortedCoin = users.map(toNumber('coin')).sort(sort('coin'))
  let sortedBank = users.map(toNumber('bank')).sort(sort('bank'))
  let sortedLim = users.map(toNumber('diamond')).sort(sort('diamond'))
  let sortedLevel = users.map(toNumber('level')).sort(sort('level'))
  let usersExp = sortedExp.map(enumGetKey)
  let usersCoin = sortedCoin.map(enumGetKey)
  let usersBank = sortedBank.map(enumGetKey)
  let usersLim = sortedLim.map(enumGetKey)
  let usersLevel = sortedLevel.map(enumGetKey)
  let len = args[0] && args[0].length > 0 ? Math.min(50, Math.max(parseInt(args[0]), 5)) : Math.min(5, sortedCoin.length)
  let text = `
       ≡ *${mssg.lbTitle.toUpperCase()}*
    
▢ *${mssg.top.toUpperCase()} ${len} ${mssg.money.toUpperCase()}* 🪙
${mssg.you} : *${usersCoin.indexOf(m.sender) + 1}* ${mssg.of} *${usersCoin.length}*

${sortedCoin.slice(0, len).map(({ jid, coin }, i) => `*${i + 1}.* ${participants.some(p => areJidsSameUser(jid, p.id)) ? `*${conn.getName(jid)}*` : `@${jid.split`@`[0]}`} ➭ _${coin.toLocaleString()}_ 🪙`).join`\n`}

▢ *${mssg.top.toUpperCase()} ${len} ${mssg.dmd.toUpperCase()} 💎* 
${mssg.you} : *${usersLim.indexOf(m.sender) + 1}* ${mssg.of} *${usersLim.length}*

${sortedLim.slice(0, len).map(({ jid, diamond }, i) => `*${i + 1}.* ${participants.some(p => areJidsSameUser(jid, p.id)) ? `*${conn.getName(jid)}*` : `@${jid.split`@`[0]}`} ➭ _${diamond.toLocaleString()}_ 💎`).join`\n`}

▢ *${mssg.top.toUpperCase()} ${len} ${mssg.lvl.toUpperCase()}* ⬆️
${mssg.you} : *${usersLevel.indexOf(m.sender) + 1}* ${mssg.of} *${usersLevel.length}*

${sortedLevel.slice(0, len).map(({ jid, level }, i) => `*${i + 1}.* ${participants.some(p => areJidsSameUser(jid, p.id)) ? `*${conn.getName(jid)}*` : `@${jid.split`@`[0]}`} ➭ _${mssg.lvl} ${level}_`).join`\n`}
`.trim()
  conn.reply(m.chat, text, m, {
    mentions: [...usersBank.slice(0, len), ...usersCoin.slice(0, len), ...usersExp.slice(0, len), ...usersLim.slice(0, len), ...usersLevel.slice(0, len)].filter(v => !participants.some(p => areJidsSameUser(v, p.id) )) 
})
 
}
handler.help = ['leaderboard']
handler.tags = ['econ']
handler.command = ['leaderboard', 'lb', 'top'] 

export default handler

function sort(property, ascending = true) {
  if (property) return (...args) => args[ascending & 1][property] - args[!ascending & 1][property]
  else return (...args) => args[ascending & 1] - args[!ascending & 1]
}

function toNumber(property, _default = 0) {
  if (property) return (a, i, b) => {
    return {...b[i], [property]: a[property] === undefined ? _default : a[property]}
  }
  else return a => a === undefined ? _default : a
}

function enumGetKey(a) {
  return a.jid
}

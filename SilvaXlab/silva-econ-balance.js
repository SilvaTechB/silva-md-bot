
let handler = async (m, {conn, usedPrefix}) => {
	
    let who = m.quoted ? m.quoted.sender : m.mentionedJid && m.mentionedJid[0] ? m.mentionedJid[0] : m.fromMe ? conn.user.jid : m.sender
    let user = global.db.data.users[who]
    if (!(who in global.db.data.users)) throw `✳️ ${mssg.userDb}`
    conn.reply(m.chat, `
 ≡ *${mssg.name}:* @${who.split('@')[0]}

 💰 *${mssg.purse.toUpperCase()}*
┌───⊷
▢ *💎${mssg.dmd}:* _${user.diamond.toLocaleString()}_
▢ *🪙${mssg.money}:* _${user.coin.toLocaleString()}_
└──────────────
`, m, { mentions: [who] })
}
handler.help = ['balance']
handler.tags = ['econ']
handler.command = ['bal', 'diamantes', 'diamond', 'balance'] 

export default handler

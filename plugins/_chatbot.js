import fetch from 'node-fetch'
export async function before(m, { conn }) {
if (m.isBaileys && m.fromMe)
        return !0
    if (!m.isGroup) return !1
    let user = global.db.data.users[m.sender]
    let lang = user.language

      if (!user.chatbot)
        return !0
        try {
        let res = await fetch('https://api.simsimi.vn/v1/simtalk', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `text=${encodeURIComponent(m.text)}&lc=${lang}&key=`
  })
  let json = await res.json()
  m.reply(json.message.replace('simsimi', `${botName}`).replace('Simsimi', `${botName}`).replace('sim simi', `${botName}`))
      } catch {
        m.reply(`❎ La  api de SimSimi se cayo!!\n\nDesactiva chatbot con */off chatbot*`)
      }
}
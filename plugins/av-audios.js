let handler = m => m
handler.all = async function (m) {
  for (const message in audioMsg) {
    if (new RegExp(`^${message}$`, 'i').test(m.text)) {
      this.sendFile(m.chat, audioMsg[message], 'audio.mp3', null, m, true)
      break
    }
  }
  return !0
 }

export default handler


let audioMsg = {
  'silva': './media/Alive.mp3',
  'menu': './media/Menu.mp3',
  'bot': 'https://j.top4top.io/m_26464yyei1.mp3',
  'hello': 'https://i.top4top.io/m_2646qxac91.mp3',
  'sasa': 'https://h.top4top.io/m_26460eg6v1.mp3',
  'sad': 'https://h.top4top.io/m_2474fhcbh1.mp3',
  '@254743706010|@254700143167': 'https://l.top4top.io/m_2492i4mdu1.mp3'
}
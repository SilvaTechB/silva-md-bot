
import { addExif } from '../lib/sticker.js'
let handler = async (m, { conn, text, args }) => {
  if (!m.quoted) throw `${mssg.replyStick}`
  let stiker = false
       let stick = args.join(" ").split("|");
       let f = stick[0] !== "" ? stick[0] : packname;
       let g = typeof stick[1] !== "undefined" ? stick[1] : author;
  try {
    let mime = m.quoted.mimetype || ''
    if (!/webp/.test(mime)) throw `${mssg.replyStick}`
    let img = await m.quoted.download()
    if (!img) throw `${mssg.replyStick}`
    stiker = await addExif(img, f, g)
  } catch (e) {
    console.error(e)
    if (Buffer.isBuffer(e)) stiker = e
  } finally {
    if (stiker) conn.sendFile(m.chat, stiker, 'wm.webp', '', m, null, rpl)
     else throw 'La conversión falló'
  }
}
handler.help = ['take <nombre>|<autor>']
handler.tags = ['sticker']
handler.command = ['take', 'wm'] 

export default handler

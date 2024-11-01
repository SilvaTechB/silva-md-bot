import fetch from 'node-fetch'

let handler = async (m, { conn }) => {

let msg = `Jay Shree Ram !! 🚩🙇`
let endpoint = `https://shizoapi.onrender.com/api/devotional/ram?apikey=${shizokeys}`
const response = await fetch(endpoint);
if (response.ok) {
      const imageBuffer = await response.buffer();
      await conn.sendFile(m.chat, imageBuffer, 'shizo.techie.error.png', msg, m, null, rpig);
    } else {
      throw bug
    }
}

handler.tags = ['images']
handler.help = handler.command = ['ram', 'shreeram']

export default handler

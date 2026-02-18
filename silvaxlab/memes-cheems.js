import fetch from 'node-fetch'

let handler = async (m, { conn }) => {

let msg = `Cheemu Memes 😂😂`
let endpoint = `https://shizoapi.onrender.com/api/memes/cheems?apikey=${shizokeys}`
const response = await fetch(endpoint);
if (response.ok) {
      const imageBuffer = await response.buffer();
      await conn.sendFile(m.chat, imageBuffer, 'shizo.techie.error.png', msg, m, null, rpyt);
    } else {
      throw bug
    }
}

handler.tags = ['memes']
handler.help = handler.command = ['cheems']

export default handler

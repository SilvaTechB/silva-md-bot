
import fs from 'fs'
let handler = async (m, { conn, text }) => {
    
    m.react(done)
    let sesi = await fs.readFileSync('./database.json')
    return await conn.sendFile(m.chat, sesi, 'database.json' , '', m, null, { mimetype: 'application/json', asDocument: true })
}

handler.command = /^(getdb)$/i
handler.rowner = true

export default handler

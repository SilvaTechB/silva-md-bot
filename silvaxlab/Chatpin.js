let handler = async (m, { conn, args }) => {
conn.reply(m.chat, 'Chat pinned 📌', m)
await conn.chatModify({ pin: true }, m.chat)
}

handler.help = ['pin']
handler.tags = ['owner']
handler.command = ['pin']
handler.owner = true 
export default handler

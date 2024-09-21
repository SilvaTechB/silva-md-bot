
let handler = async(m, { conn, usedPrefix, command }) => {
	m.react(rwait)
	
	let res = await conn.getFile(global.API('fgmods', '/api/img/ai-face', { }, 'apikey'))
	let img = res.data
        await conn.sendFile(m.chat, img, 'img.jpg', `✅ Esta persona no existe fue generado con IA`, m) 
	m.react(done) 
}
handler.help = ['person']
handler.tags = ['img']
handler.command = ['persona', 'person']

export default handler

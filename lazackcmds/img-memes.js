
let handler = async(m, { conn, usedPrefix, command }) => {
	
	let img = await conn.getFile(global.API('fgmods', '/api/img/meme', { }, 'apikey'))
	let meme = img.data
	m.react("😂")
      await conn.sendFile(m.chat, meme, '', '', m) 
      
}
handler.help = ['meme']
handler.tags = ['img']
handler.command = ['meme', 'memes'] 

export default handler

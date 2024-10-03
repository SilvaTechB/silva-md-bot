

let handler = async (m, { conn, args, text, usedPrefix, command }) => {
	
   let tee = `✳️ ${mssg.notext}\n\n📌 ${mssg.example}: *${usedPrefix + command}* FG98`
   let too = `✳️ ${mssg.textSe} *+* \n\n📌 ${mssg.example}: \n*${usedPrefix + command}* fgmods *+* ${botName}`
    m.react(rwait)

switch (command) {
	
	case 'logololi':
	if (!text) throw tee
	let img = global.API('fgmods', '/api/maker/loli', { text }, 'apikey')
	conn.sendFile(m.chat, img, 'logo.png', `✅ ${mssg.result}`, m)
	m.react(done)
	break 
	case 'neon': 
	if (!text) throw tee
	let ne = global.API('fgmods', '/api/textpro/neon', { text }, 'apikey')
	conn.sendFile(m.chat, ne, 'logo.png', `✅ ${mssg.result}`, m)
	m.react(done)
	break 
	case 'devil': 
	if (!text) throw tee
	let de = global.API('fgmods', '/api/textpro/devil', { text }, 'apikey')
	conn.sendFile(m.chat, de, 'logo.png', `✅ ${mssg.result}`, m)
	m.react(done)
	break 
	case 'transformer': 
	if (!text) throw tee
	let tra = global.API('fgmods', '/api/textpro/transformers', { text }, 'apikey')
	conn.sendFile(m.chat, tra, 'logo.png', `✅ ${mssg.result}`, m)
	m.react(done)
	break 
	case 'thunder': 
	if (!text) throw tee
	let thu = global.API('fgmods', '/api/textpro/thunder', { text }, 'apikey')
	conn.sendFile(m.chat, thu, 'logo.png', `✅ ${mssg.result}`, m)
	m.react(done)
	break  
	case 'graffiti': 
	if (!text) throw too
	if (!text.includes('+')) throw too  
	let [c, d] = text.split`+`
	let gff = global.API('fgmods', '/api/textpro/graffiti', { text: c, text2: d}, 'apikey')
	conn.sendFile(m.chat, gff, 'logo.png', `✅ ${mssg.result}`, m)
	m.react(done)
	break
	case 'bpink': 
	if (!text) throw tee
	let bpin = global.API('fgmods', '/api/textpro/blackpink', { text }, 'apikey')
	conn.sendFile(m.chat, bpin, 'logo.png', `✅${mssg.result}`, m)
	m.react(done)
	break 
	case 'joker': 
	if (!text) throw tee
	let jok = global.API('fgmods', '/api/textpro/joker', { text }, 'apikey')
	conn.sendFile(m.chat, jok, 'logo.png', `✅ ${mssg.result}`, m)
	m.react(done)
	break 
	case 'matrix': 
	if (!text) throw tee
	let ma = global.API('fgmods', '/api/textpro/matrix', { text }, 'apikey')
	conn.sendFile(m.chat, ma, 'logo.png', `✅ ${mssg.result}`, m)
	m.react(done)
	break 
	case 'wolf': 
   if (!text) throw tee
   let wo = global.API('fgmods', '/api/textpro/logowolf', { text: 'FG98', text2: text}, 'apikey')
	conn.sendFile(m.chat, wo, 'logo.png', `✅ ${mssg.result}`, m)
	m.react(done)
	break
	case 'glow': 
	if (!text) throw tee
	let glo = global.API('fgmods', '/api/textpro/advancedglow', { text }, 'apikey')
	conn.sendFile(m.chat, glo, 'logo.png', `✅ ${mssg.result}`, m)
	m.react(done)
	break 
	case 'phlogo': 
	if (!text) throw too
	if (!text.includes('+')) throw too  
	let [a, b] = text.split`+`   
	let ph = global.API('fgmods', '/api/textpro/pornhub', { text: a, text2: b}, 'apikey')
	conn.sendFile(m.chat, ph, 'logo.png', `✅ ${mssg.result}`, m)
	m.react(done)
	break
	case 'ballon': 
	if (!text) throw tee
	let ball = global.API('fgmods', '/api/textpro/ballon', { text }, 'apikey')
	conn.sendFile(m.chat, ball, 'logo.png', `✅ ${mssg.result}`, m)
	m.react(done)
	break
	case 'dmd': 
	if (!text) throw tee
	let dm = global.API('fgmods', '/api/textpro/diamond', { text }, 'apikey')
	conn.sendFile(m.chat, dm, 'logo.png', `✅ ${mssg.result}`, m)
	m.react(done)
	break
	case 'lightglow': 
	if (!text) throw tee
	let lglo = global.API('fgmods', '/api/textpro/lightglow', { text }, 'apikey')
	conn.sendFile(m.chat, lglo, 'logo.png', `✅ ${mssg.result}`, m)
	m.react(done)
	break 
	case 'american': 
	if (!text) throw tee
	let am = global.API('fgmods', '/api/textpro/American-flag', { text }, 'apikey')
	conn.sendFile(m.chat, am, 'logo.png', `✅ ${mssg.result}`, m)
	m.react(done)
	break 
	case 'halloween': 
	if (!text) throw tee
	let hall = global.API('fgmods', '/api/textpro/halloween', { text }, 'apikey')
	conn.sendFile(m.chat, hall, 'logo.png', `✅ ${mssg.result}`, m)
	m.react(done)
	break 
	case 'green': 
	if (!text) throw tee
	let hgre = global.API('fgmods', '/api/textpro/green-horror', { text }, 'apikey')
	conn.sendFile(m.chat, hgre, 'logo.png', `✅ ${mssg.result}`, m)
	m.react(done)
	break 
	case 'glitch': 
	if (!text) throw tee
	let igli = global.API('fgmods', '/api/textpro/impressive-glitch', { text }, 'apikey')
	conn.sendFile(m.chat, igli, 'logo.png', `✅ ${mssg.result}`, m)
	m.react(done)
	break
	case 'paper': 
	if (!text) throw tee
	let pap = global.API('fgmods', '/api/textpro/art-paper-cut', { text }, 'apikey')
	conn.sendFile(m.chat, pap, 'logo.png', `✅ ${mssg.result}`, m)
	m.react(done)
	break
	case 'marvel': 
	if (!text) throw too
	if (!text.includes('+')) throw too  
	let [e, f] = text.split`+`   
	let marv = global.API('fgmods', '/api/textpro/marvel', { text: e, text2: f}, 'apikey')
	conn.sendFile(m.chat, marv, 'logo.png', `✅ ${mssg.result}`, m)
	m.react(done)
	break
	case 'ninja': 
	if (!text) throw too
	if (!text.includes('+')) throw too  
	let [g, h] = text.split`+`   
	let nin = global.API('fgmods', '/api/textpro/ninja', { text: g, text2: h}, 'apikey')
	conn.sendFile(m.chat, nin, 'logo.png', `✅ ${mssg.result}`, m)
	m.react(done)
	break
	case 'future': 
	if (!text) throw tee
	let futu = global.API('fgmods', '/api/textpro/futuristic', { text }, 'apikey')
	conn.sendFile(m.chat, futu, 'logo.png', `✅ ${mssg.result}`, m)
	m.react(done)
	break
	case '3dbox': 
	if (!text) throw tee
	let box = global.API('fgmods', '/api/textpro/3dboxtext', { text }, 'apikey')
	conn.sendFile(m.chat, box, 'logo.png', `✅ ${mssg.result}`, m)
	m.react(done)
	break
	case 'graffiti2': 
	if (!text) throw too
	if (!text.includes('+')) throw too  
	let [i, j] = text.split`+`
	let gff2 = global.API('fgmods', '/api/textpro/graffiti2', { text: i, text2: j}, 'apikey')
	conn.sendFile(m.chat, gff2, 'logo.png', `✅ ${mssg.result}`, m)
	m.react(done)
	break 
	default:
} 
} 
handler.help = ['logololi', 'graffiti2', '3dbox', 'future', 'ninja', 'marvel', 'paper', 'glitch', 'halloween', 'green', 'american', 'neon', 'devil', 'wolf', 'phlogo', 'transformer', 'thunder', 'graffiti', 'bpink', 'joker', 'matrix', 'glow', 'ballon', 'dmd', 'lightglow']
handler.tags = ['maker']
handler.command = /^(logololi|graffiti2|3dbox|future|ninja|marvel|paper|glitch|neon|green|halloween|american|devil|wolf|phlogo|transformer|thunder|graffiti|bpink|joker|matrix|glow|ballon|dmd|lightglow)$/i
handler.diamond = true

export default handler

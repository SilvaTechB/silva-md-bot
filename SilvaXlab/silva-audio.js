import fs from 'fs'
import { join } from 'path'
import { exec } from 'child_process'

let handler = async (m, { conn, args, __dirname, usedPrefix, command }) => {
	try {
		let q = m.quoted ? m.quoted : m
		let mime = (q.msg || q).mimetype || q.mediaType || ''
		if (/audio/.test(mime)) {
           conn.reply(m.chat, 'Please Wait...', m)
            
			let set = /bass/.test(command) ? '-af equalizer=f=94:width_type=o:width=2:g=30'
				: /blown/.test(command) ? '-af acrusher=.1:1:64:0:log'
				: /deep/.test(command) ? '-af atempo=4/4,asetrate=44500*2/3'
				: /earrape/.test(command) ? '-af volume=12'
				: /fast/.test(command) ? '-filter:a "atempo=1.63,asetrate=44100"'
				: /fat/.test(command) ? '-filter:a "atempo=1.6,asetrate=22100"'
				: /nightcore/.test(command) ? '-filter:a atempo=1.06,asetrate=44100*1.25'
				: /reverse/.test(command) ? '-filter_complex "areverse"'
				: /robot/.test(command) ? '-filter_complex "afftfilt=real=\'hypot(re,im)*sin(0)\':imag=\'hypot(re,im)*cos(0)\':win_size=512:overlap=0.75"'
				: /slow/.test(command) ? '-filter:a "atempo=0.7,asetrate=44100"'
				: /tupai|squirrel|chipmunk/.test(command) ? '-filter:a "atempo=0.5,asetrate=65100"'
				: '-filter:v "minterpolate=\'mi_mode=mci:mc_mode=aobmc:vsbmc=1:fps=120\'"' // filter smooth
			let dir = join(__dirname, '../tmp/')
			let filename = dir + getRandom('.mp3')
			let media = dir + getRandom('.mp3')
			fs.writeFileSync(media, await q.download(), function (err) { if (err) throw err })
			exec(`ffmpeg -i ${media} ${set} ${filename}`, async (err, stderr, stdout) => {
				await fs.unlinkSync(media)
				if (err) throw err
				let buff = await fs.readFileSync(filename)
				await conn.sendFile(m.chat, buff, '', '', m, true)
			})
		} else throw `Reply / tag audio!`
	} catch (e) {
		throw e
	}
}

handler.help = ['bass','blown','deep','earrape','fast','fat','nightcore','reverse','robot','slow','smooth']
handler.tags = ['tools', 'audio']
handler.command = /^(bass|blown|deep|earrape|fas?t|nightcore|reverse|robot|slow|smooth|tupai|squirrel|chipmunk)$/i

export default handler

const getRandom = (ext) => {
return `${Math.floor(Math.random() * 100000)}${ext}`}

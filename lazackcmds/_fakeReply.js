
import fetch from 'node-fetch'

let handler = m => m
handler.all = async function (m) {
	
	let who = m.mentionedJid && m.mentionedJid[0] ? m.mentionedJid[0] : m.fromMe ? this.user.jid : m.sender
	let pp = await this.profilePictureUrl(who, 'image').catch(_ => 'https://files.catbox.moe/8324jm.jpg')
	
	//reply link wa
   global.rpgc = { contextInfo: { externalAdReply: { mediaUrl: 'https://files.catbox.moe/8324jm.jpg', mediaType: 'VIDEO', description: 'support group', title: 'JOIN GROUP', body: 'support group', thumbnailUrl: 'https://files.catbox.moe/8324jm.jpg', sourceUrl: 'https://silvatech.vercel.app' }}} 
	
	//reply link Github 
    global.rpig = { contextInfo: { externalAdReply: { mediaUrl: 'https://files.catbox.moe/8324jm.jpg', mediaType: 'VIDEO', description: 'FOLLOW DEVELOPER', title: 'GITHUB', body: 'Keep bot alive', thumbnailUrl: 'https://i.imgur.com/RCMg1aL.jpg', sourceUrl: 'https://github.com/SilvaTechB' }}}
	
	//reply link yt
    global.rpyt = { contextInfo: { externalAdReply: { showAdAttribution: true, mediaUrl: 'https://files.catbox.moe/8324jm.jpg', mediaType: 'VIDEO', description: 'SUBSCRIBE : silva edits YT', title: 'YouTube', body: 'learn to create your own bots', thumbnailUrl: 'https://files.catbox.moe/8324jm.jpg', sourceUrl: 'https://youtube.com/@silvaedits254' }}}

//reply link WhatsApp Channel
    global.rpwp = { contextInfo: { externalAdReply: { showAdAttribution: true, mediaUrl: 'https://files.catbox.moe/8324jm.jpg', mediaType: 'VIDEO', description: 'Follow Channel', title: 'SILVA-BOT CHANNEL', body: 'To Get Updates About OREO-BOT', thumbnailUrl: 'https://files.catbox.moe/8324jm.jpg', sourceUrl: 'https://whatsapp.com/channel/0029VaAkETLLY6d8qhLmZt2v' }}}
    
} 
export default handler

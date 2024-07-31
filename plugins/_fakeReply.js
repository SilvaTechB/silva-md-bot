
import fetch from 'node-fetch'

let handler = m => m
handler.all = async function (m) {
	
	let who = m.mentionedJid && m.mentionedJid[0] ? m.mentionedJid[0] : m.fromMe ? this.user.jid : m.sender
	let pp = await this.profilePictureUrl(who, 'image').catch(_ => 'https://i.imgur.com/RCMg1aL.jpg')
	
	//reply link wa
   global.rpgc = { contextInfo: { externalAdReply: { mediaUrl: 'https://i.imgur.com/RCMg1aL.jpg', mediaType: 'VIDEO', description: 'support group', title: 'JOIN GROUP', body: 'support group', thumbnailUrl: 'https://i.imgur.com/RCMg1aL.jpg', sourceUrl: 'https://chat.whatsapp.com/DWqdPuQ0yFkKyf1SzZ0k9Y' }}} 
	
	//reply link Instagram 
    global.rpig = { contextInfo: { externalAdReply: { mediaUrl: 'https://i.imgur.com/RCMg1aL.jpg', mediaType: 'VIDEO', description: 'FOLLOW DEVELOPER', title: 'INSTAGRAM', body: 'Keep bot alive', thumbnailUrl: 'https://i.imgur.com/RCMg1aL.jpg', sourceUrl: 'https://instagram.com/shizo_the_techie' }}}
	
	//reply link yt
    global.rpyt = { contextInfo: { externalAdReply: { showAdAttribution: true, mediaUrl: 'https://i.imgur.com/RCMg1aL.jpg', mediaType: 'VIDEO', description: 'SUBSCRIBE : ERROR MODS YT', title: 'YouTube', body: 'learn to create your own bots', thumbnailUrl: 'https://i.imgur.com/RCMg1aL.jpg', sourceUrl: 'https://youtube.com/@ERRORMODSYT' }}}

//reply link WhatsApp Channel
    global.rpwp = { contextInfo: { externalAdReply: { showAdAttribution: true, mediaUrl: 'https://i.imgur.com/RCMg1aL.jpg', mediaType: 'VIDEO', description: 'Follow Channel', title: 'OREO-BOT CHANNEL', body: 'To Get Updates About OREO-BOT', thumbnailUrl: 'https://i.imgur.com/RCMg1aL.jpg', sourceUrl: 'https://whatsapp.com/channel/0029VaCkzkr3wtb1uYWiRz2o' }}}
    
} 
export default handler

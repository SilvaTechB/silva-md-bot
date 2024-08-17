
import yts from 'yt-search'
let handler = async (m, { conn, command, text, usedPrefix }) => {

        if (!text) throw `✳️𝐒𝐈𝐋𝐕𝐀 𝐌𝐃 𝐁𝐎𝐓 MUSIC \n\n📌Example *${usedPrefix + command}* Lil Peep hate my life`
        let res = await yts(text)
        let vid = res.videos[0]
        if (!vid) throw `✳️ Vídeo/Audio not found`
        let { title, description, thumbnail, videoId, timestamp, views, ago, url } = vid
        //const url = 'https://www.youtube.com/watch?v=' + videoId
        m.react('🎧')
        let play = `
        ≡ *𝐒𝐈𝐋𝐕𝐀 𝐌𝐃 𝐁𝐎𝐓 MUSIC*
┌──────────────
▢ 📌 *Title* : ${title}
▢ 📆 *Publication:* ${ago}
▢ ⌚ *Duration:* ${timestamp}
▢ 👀 *Views:* ${views}
└─────𝐒𝐈𝐋𝐕𝐀 𝐌𝐃 𝐁𝐎𝐓─────────`
 await conn.sendButton(m.chat, play, fgig, thumbnail, [
    ['🎶 MP3', `${usedPrefix}fgmp3 ${url}`],
    ['🎥 MP4', `${usedPrefix}fgmp4 ${url}`]
  ], m, rpl)
}
handler.help = ['play']
handler.tags = ['download']
handler.command = ['play', 'playvid']
handler.disabled = true

export default handler
import fetch from 'node-fetch'
import yts from 'yt-search'

let handler = async (m, { conn: conn, command, args, text, usedPrefix }) => {
  if (!text) return conn.reply(m.chat, '🐯 Enter the title of a YouTube video or song.\n\n`Example:`\n' + `> *${usedPrefix + command}* Gemini Aaliyah - If Only`, m)
await m.react('🕓')
    try {
    let res = await search(args.join(" "))
    let img = await (await fetch(`${res[0].image}`)).buffer()
    let txt = '`乂 SILVA MD YOUTUBE PLAYER`\n\n'
       txt += `	✩   *Title* : ${res[0].title}\n`
       txt += `	✩   *Duration* : ${secondString(res[0].duration.seconds)}\n`
       txt += `	✩   *Published* : ${eYear(res[0].ago)}\n`
       txt += `	✩   *Canal* : ${res[0].author.name || 'Desconocido'}\n`
       txt += `	✩   *Url* : ${'https://youtu.be/' + res[0].videoId}\n\n`
       txt += `> *-*To download reply to this message with *Video* or *Audio*.`
await conn.sendFile(m.chat, img, 'thumbnail.jpg', txt, m)
await m.react('💀')
} catch {
await m.react('✖️')
}}
handler.help = ['play *<search>*']
handler.tags = ['downloader']
handler.command = ['play']
//handler.register = true 
export default handler

async function search(query, options = {}) {
  let search = await yts.search({ query, hl: "es", gl: "ES", ...options })
  return search.videos
}

function MilesNumber(number) {
  let exp = /(\d)(?=(\d{3})+(?!\d))/g
  let rep = "$1."
  let arr = number.toString().split(".")
  arr[0] = arr[0].replace(exp, rep)
  return arr[1] ? arr.join(".") : arr[0]
}

function secondString(seconds) {
  seconds = Number(seconds);
  const d = Math.floor(seconds / (3600 * 24));
  const h = Math.floor((seconds % (3600 * 24)) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const dDisplay = d > 0 ? d + (d == 1 ? ' Día, ' : ' Días, ') : '';
  const hDisplay = h > 0 ? h + (h == 1 ? ' Hora, ' : ' Horas, ') : '';
  const mDisplay = m > 0 ? m + (m == 1 ? ' Minuto, ' : ' Minutos, ') : '';
  const sDisplay = s > 0 ? s + (s == 1 ? ' Segundo' : ' Segundos') : '';
  return dDisplay + hDisplay + mDisplay + sDisplay;
}

function sNum(num) {
    return new Intl.NumberFormat('en-GB', { notation: "compact", compactDisplay: "short" }).format(num)
}

function eYear(txt) {
    if (!txt) {
        return '×'
    }
    if (txt.includes('month ago')) {
        var T = txt.replace("month ago", "").trim()
        var L = 'does '  + T + ' month'
        return L
    }
    if (txt.includes('months ago')) {
        var T = txt.replace("months ago", "").trim()
        var L = 'does ' + T + ' months'
        return L
    }
    if (txt.includes('year ago')) {
        var T = txt.replace("year ago", "").trim()
        var L = 'does ' + T + ' year'
        return L
    }
    if (txt.includes('years ago')) {
        var T = txt.replace("years ago", "").trim()
        var L = 'does ' + T + ' years'
        return L
    }
    if (txt.includes('hour ago')) {
        var T = txt.replace("hour ago", "").trim()
        var L = 'does ' + T + ' hour'
        return L
    }
    if (txt.includes('hours ago')) {
        var T = txt.replace("hours ago", "").trim()
        var L = 'does ' + T + ' hours'
        return L
    }
    if (txt.includes('minute ago')) {
        var T = txt.replace("minute ago", "").trim()
        var L = 'does ' + T + ' minute'
        return L
    }
    if (txt.includes('minutes ago')) {
        var T = txt.replace("minutes ago", "").trim()
        var L = 'does ' + T + ' minutes'
        return L
    }
    if (txt.includes('day ago')) {
        var T = txt.replace("day ago", "").trim()
        var L = 'does ' + T + ' day'
        return L
    }
    if (txt.includes('days ago')) {
        var T = txt.replace("days ago", "").trim()
        var L = 'does ' + T + ' day'
        return L
    }
    return txt
}

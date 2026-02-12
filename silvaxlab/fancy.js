const config = require('../config')

const styles = {
    bold: t => t.split('').map(c => {
        const code = c.charCodeAt(0)
        if (code >= 65 && code <= 90) return String.fromCodePoint(0x1D400 + code - 65)
        if (code >= 97 && code <= 122) return String.fromCodePoint(0x1D41A + code - 97)
        return c
    }).join(''),
    italic: t => t.split('').map(c => {
        const code = c.charCodeAt(0)
        if (code >= 65 && code <= 90) return String.fromCodePoint(0x1D434 + code - 65)
        if (code >= 97 && code <= 122) return String.fromCodePoint(0x1D44E + code - 97)
        return c
    }).join(''),
    monospace: t => t.split('').map(c => {
        const code = c.charCodeAt(0)
        if (code >= 65 && code <= 90) return String.fromCodePoint(0x1D670 + code - 65)
        if (code >= 97 && code <= 122) return String.fromCodePoint(0x1D68A + code - 97)
        return c
    }).join(''),
    script: t => t.split('').map(c => {
        const code = c.charCodeAt(0)
        if (code >= 65 && code <= 90) return String.fromCodePoint(0x1D49C + code - 65)
        if (code >= 97 && code <= 122) return String.fromCodePoint(0x1D4B6 + code - 97)
        return c
    }).join(''),
    fraktur: t => t.split('').map(c => {
        const code = c.charCodeAt(0)
        if (code >= 65 && code <= 90) return String.fromCodePoint(0x1D504 + code - 65)
        if (code >= 97 && code <= 122) return String.fromCodePoint(0x1D51E + code - 97)
        return c
    }).join(''),
    double: t => t.split('').map(c => {
        const code = c.charCodeAt(0)
        if (code >= 65 && code <= 90) return String.fromCodePoint(0x1D538 + code - 65)
        if (code >= 97 && code <= 122) return String.fromCodePoint(0x1D552 + code - 97)
        return c
    }).join(''),
    small: t => t.toLowerCase().split('').map(c => {
        const map = 'ᴀʙᴄᴅᴇꜰɢʜɪᴊᴋʟᴍɴᴏᴘǫʀsᴛᴜᴠᴡxʏᴢ'
        const code = c.charCodeAt(0) - 97
        if (code >= 0 && code <= 25) return map[code]
        return c
    }).join(''),
    bubble: t => t.split('').map(c => {
        const code = c.charCodeAt(0)
        if (code >= 65 && code <= 90) return String.fromCodePoint(0x24B6 + code - 65)
        if (code >= 97 && code <= 122) return String.fromCodePoint(0x24D0 + code - 97)
        return c
    }).join(''),
    square: t => t.split('').map(c => {
        const code = c.charCodeAt(0)
        if (code >= 65 && code <= 90) return String.fromCodePoint(0x1F130 + code - 65)
        return c
    }).join('').toUpperCase(),
    flip: t => t.split('').reverse().map(c => {
        const flipMap = { a:'ɐ',b:'q',c:'ɔ',d:'p',e:'ǝ',f:'ɟ',g:'ƃ',h:'ɥ',i:'ᴉ',j:'ɾ',k:'ʞ',l:'l',m:'ɯ',n:'u',o:'o',p:'d',q:'b',r:'ɹ',s:'s',t:'ʇ',u:'n',v:'ʌ',w:'ʍ',x:'x',y:'ʎ',z:'z' }
        return flipMap[c.toLowerCase()] || c
    }).join('')
}

const handler = {
    help: ['fancy', 'font'],
    tags: ['fun', 'utility'],
    command: /^(fancy|font)$/i,
    group: false,
    admin: false,
    botAdmin: false,
    owner: false,

    execute: async ({ jid, sock, message, args }) => {
        try {
            if (args.length < 1) {
                const sampleText = 'Silva MD'
                const preview = Object.entries(styles)
                    .map(([name, fn]) => `*${name}:* ${fn(sampleText)}`)
                    .join('\n')

                return sock.sendMessage(jid, {
                    text: `╭━━━━━━━━━━━━━━━━━━━━╮
┃   ✨ FANCY TEXT      ┃
╰━━━━━━━━━━━━━━━━━━━━╯

*Usage:*
${config.PREFIX}fancy <style> <text>

*Available Styles:*
${preview}

*Example:*
${config.PREFIX}fancy bold Hello World`
                }, { quoted: message })
            }

            const styleName = args[0].toLowerCase()
            const text = args.slice(1).join(' ')

            if (!text) {
                return sock.sendMessage(jid, {
                    text: `Please provide text.\n\n*Usage:* ${config.PREFIX}fancy ${styleName} <text>`
                }, { quoted: message })
            }

            if (!styles[styleName]) {
                return sock.sendMessage(jid, {
                    text: `Unknown style: ${styleName}\n\nAvailable: ${Object.keys(styles).join(', ')}`
                }, { quoted: message })
            }

            const result = styles[styleName](text)
            await sock.sendMessage(jid, { text: result }, { quoted: message })

        } catch (err) {
            await sock.sendMessage(jid, {
                text: `❌ Error: ${err.message}`
            }, { quoted: message })
        }
    }
}

module.exports = { handler }

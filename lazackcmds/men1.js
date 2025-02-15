import { proto, generateWAMessageFromContent } from '@whiskeysockets/baileys'
import moment from 'moment-timezone'
import { xpRange } from '../lib/levelling.js'

let handler = async (m, { conn, usedPrefix, command }) => {
    try {
        // User validation
        const who = m.quoted?.sender || m.mentionedJid?.[0] || (m.fromMe ? conn.user.jid : m.sender)
        if (!who || !(who in global.db.data.users)) throw '✳️ User not found in database'

        // User data setup
        const user = global.db.data.users[who]
        const { level } = user
        const { min, xp, max } = xpRange(level, global.multiplier)
        const greeting = ucapan()
        const uptime = clockString(process.uptime() * 1000)

        // Modern button structure
        const buttons = [
            { 
                quickReplyButton: { 
                    displayText: '📜 Main Menu', 
                    id: `${usedPrefix}menu`
                }
            },
            {
                quickReplyButton: {
                    displayText: '🎵 Play Music',
                    id: `${usedPrefix}play`
                }
            },
            {
                urlButton: {
                    displayText: '💻 GitHub Repo',
                    url: 'https://github.com/SilvaTechB/silva-md-bot'
                }
            },
            {
                callButton: {
                    displayText: '📞 Contact Owner',
                    phoneNumber: '+254700143167'
                }
            }
        ]

        // Interactive message template
        const template = generateWAMessageFromContent(m.chat, 
            {
                templateMessage: {
                    hydratedTemplate: {
                        hydratedContentText: `
                        *${greeting} ${user.name}!*\n
                        ┌──「 *Silva MD Bot* 」
                        │  ➤ *Level:* ${level}
                        │  ➤ *XP:* ${xp}/${max}
                        │  ➤ *Uptime:* ${uptime}
                        └── © 2025 Silva Tech Inc.
                        `,
                        hydratedFooterText: 'Tap buttons below to interact',
                        hydratedButtons: buttons,
                        headerType: proto.HeadersType.EMPTY
                    }
                }
            },
            { userJid: m.chat }
        )

        // Send message
        await conn.relayMessage(m.chat, template.message, { messageId: template.key.id })

    } catch (error) {
        console.error('Menu error:', error)
        await conn.sendMessage(m.chat, { 
            text: `❌ Error loading menu: ${error.message}`,
            mentions: [m.sender]
        })
    }
}

// Button interaction handler
conn.ev.on('messages.upsert', async ({ messages }) => {
    const msg = messages[0]
    if (msg?.message?.buttonsResponseMessage) {
        const buttonId = msg.message.buttonsResponseMessage.selectedButtonId
        const user = msg.key.remoteJid
        
        try {
            switch(buttonId) {
                case `${usedPrefix}menu`:
                    await handler(msg, conn, usedPrefix, 'menu')
                    break
                case `${usedPrefix}play`:
                    await conn.sendMessage(user, { text: '🎶 Enter song name:' })
                    break
                case `${usedPrefix}copycode`:
                    await conn.sendMessage(user, { 
                        text: '📋 Code copied!',
                        mentions: [user]
                    })
                    break
                // Add more button handlers
            }
        } catch (error) {
            console.error('Button handler error:', error)
            await conn.sendMessage(user, {
                text: `❌ Button action failed: ${error.message}`
            })
        }
    }
})

// Command configuration
handler.help = ['menu', 'help'].map(v => v + ' ➞ Access bot controls')
handler.tags = ['core']
handler.command = ['menu1', 'controls', 'botmenu1']

export default handler

// Utility functions
function clockString(ms) {
    const h = Math.floor(ms / 3600000)
    const m = Math.floor(ms / 60000) % 60
    const s = Math.floor(ms / 1000) % 60
    return [h, m, s].map(v => v.toString().padStart(2, '0')).join(':')
}

function ucapan() {
    const hour = moment().tz('Africa/Nairobi').hour()
    return hour >= 4 && hour < 12 ? 'Good Morning 🌅' :
           hour >= 12 && hour < 18 ? 'Good Afternoon 🌞' :
           hour >= 18 && hour < 24 ? 'Good Evening 🌇' : 
           'Good Night 🌙'
}

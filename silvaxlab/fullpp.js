const config = require('../config')
const axios = require('axios')

const handler = {
    help: ['fullpp', 'fullpic'],
    tags: ['utility'],
    command: /^(fullpp|fullpic)$/i,
    group: false,
    admin: false,
    botAdmin: false,
    owner: false,

    execute: async ({ jid, sock, message, args }) => {
        const sender = message.key.participant || message.key.remoteJid

        try {
            const mentions = message.message?.extendedTextMessage?.contextInfo?.mentionedJid || []
            let targetJid = mentions[0] || sender

            if (args[0] && !mentions.length) {
                const num = args[0].replace(/[^0-9]/g, '')
                if (num) targetJid = num + '@s.whatsapp.net'
            }

            let ppUrl
            try {
                ppUrl = await sock.profilePictureUrl(targetJid, 'image')
            } catch (e) {
                return sock.sendMessage(jid, {
                    text: `❌ Could not fetch profile picture for @${targetJid.split('@')[0]}.\n\nThe user may have privacy settings enabled.`,
                    mentions: [targetJid],
                    contextInfo: createContext(sender)
                }, { quoted: message })
            }

            const { data: imgBuffer } = await axios.get(ppUrl, {
                responseType: 'arraybuffer',
                timeout: 15000
            })

            await sock.sendMessage(jid, {
                image: Buffer.from(imgBuffer),
                caption: `📸 *Full Profile Picture*\n\n👤 @${targetJid.split('@')[0]}\n\n_${config.BOT_NAME || 'Silva MD'}_`,
                mentions: [targetJid],
                contextInfo: createContext(sender)
            }, { quoted: message })

        } catch (err) {
            await sock.sendMessage(jid, {
                text: `❌ Error: ${err.message}`
            }, { quoted: message })
        }
    }
}

function createContext(sender) {
    return {
        mentionedJid: [sender],
        forwardingScore: 999,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
            newsletterJid: '120363200367779016@newsletter',
            newsletterName: 'SILVA MD • PP',
            serverMessageId: Math.floor(Math.random() * 1000)
        }
    }
}

module.exports = { handler }

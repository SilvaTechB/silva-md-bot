const config = require('../config')
const { downloadMediaMessage } = require('@whiskeysockets/baileys')

const handler = {
    help: ['vv'],
    tags: ['extra'],
    command: /^(vv|viewonce)$/i,
    group: false,
    admin: false,
    botAdmin: false,
    owner: false,

    execute: async ({ jid, sock, message }) => {
        try {
            const from = message.key.remoteJid
            const sender = message.key.participant || from
            const pushname = message.pushName || 'there'

            const ctx =
                message.message?.extendedTextMessage?.contextInfo

            if (!ctx?.quotedMessage) {
                return await sock.sendMessage(
                    jid,
                    { text: '❌ Reply to a view-once image or video.' },
                    { quoted: message }
                )
            }

            let quoted = ctx.quotedMessage

            // 🔥 Properly unwrap view-once containers
            if (quoted.viewOnceMessage) {
                quoted = quoted.viewOnceMessage.message
            } else if (quoted.viewOnceMessageV2) {
                quoted = quoted.viewOnceMessageV2.message
            } else if (quoted.viewOnceMessageV2Extension) {
                quoted = quoted.viewOnceMessageV2Extension.message
            }

            const isImage = quoted.imageMessage
            const isVideo = quoted.videoMessage

            if (!isImage && !isVideo) {
                return await sock.sendMessage(
                    jid,
                    { text: '❌ That message is not a view-once image or video.' },
                    { quoted: message }
                )
            }

            const mediaType = isImage ? 'image' : 'video'

            // 🧠 Build correct quoted key
            const quotedKey = {
                remoteJid: from,
                id: ctx.stanzaId,
                participant: ctx.participant || sender
            }

            const buffer = await downloadMediaMessage(
                {
                    key: quotedKey,
                    message: quoted
                },
                'buffer',
                {},
                { logger: console }
            )

            const caption = `
✨ *VIEW-ONCE UNLOCKED*
👤 Requested by: ${pushname}
⚡ Silva MD
`

            const mediaMsg =
                mediaType === 'image'
                    ? { image: buffer, caption }
                    : { video: buffer, caption }

            await sock.sendMessage(
                jid,
                {
                    ...mediaMsg,
                    contextInfo: {
                        mentionedJid: [sender],
                        forwardingScore: 888,
                        isForwarded: true,
                        forwardedNewsletterMessageInfo: {
                            newsletterJid: '120363200367779016@newsletter',
                            newsletterName: 'SILVA • VIEWONCE',
                            serverMessageId: Math.floor(Math.random() * 1000)
                        }
                    }
                },
                { quoted: message }
            )

        } catch (err) {
            await sock.sendMessage(
                jid,
                { text: `❌ View-once error:\n${err.message}` },
                { quoted: message }
            )
        }
    }
}

module.exports = { handler }
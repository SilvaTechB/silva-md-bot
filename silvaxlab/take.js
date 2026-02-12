const config = require('../config')
const { downloadMediaMessage } = require('@whiskeysockets/baileys')

const handler = {
    help: ['take', 'steal', 'swipe'],
    tags: ['utility'],
    command: /^(take|steal|swipe)$/i,
    group: false,
    admin: false,
    botAdmin: false,
    owner: false,

    execute: async ({ jid, sock, message, args }) => {
        try {
            const sender = message.key.participant || message.key.remoteJid
            const quotedMsg = message.message?.extendedTextMessage?.contextInfo?.quotedMessage

            if (!quotedMsg) {
                return sock.sendMessage(jid, {
                    text: `╭━━━━━━━━━━━━━━━━━━━━╮
┃   🎨 STICKER TAKE    ┃
╰━━━━━━━━━━━━━━━━━━━━╯

*Usage:*
Reply to a sticker/image with:
${config.PREFIX}take <pack name> <author>

Re-creates the sticker with your custom pack name and author.`
                }, { quoted: message })
            }

            const isSticker = !!quotedMsg.stickerMessage
            const isImage = !!quotedMsg.imageMessage
            const isVideo = !!quotedMsg.videoMessage

            if (!isSticker && !isImage && !isVideo) {
                return sock.sendMessage(jid, {
                    text: '⚠️ Reply to a sticker, image, or short video.'
                }, { quoted: message })
            }

            const packName = args[0] || config.BOT_NAME || 'Silva MD'
            const authorName = args.slice(1).join(' ') || 'Bot'

            const quotedKey = {
                key: {
                    remoteJid: jid,
                    id: message.message?.extendedTextMessage?.contextInfo?.stanzaId,
                    participant: message.message?.extendedTextMessage?.contextInfo?.participant
                },
                message: quotedMsg
            }

            const buffer = await downloadMediaMessage(quotedKey, 'buffer', {}, {
                logger: { error: () => {}, warn: () => {}, info: () => {}, debug: () => {} },
                reuploadRequest: sock.updateMediaMessage
            })

            if (isSticker || isImage) {
                await sock.sendMessage(jid, {
                    sticker: buffer,
                    packname: packName,
                    author: authorName
                }, { quoted: message })
            } else if (isVideo) {
                await sock.sendMessage(jid, {
                    sticker: buffer,
                    packname: packName,
                    author: authorName,
                    isAnimated: true
                }, { quoted: message })
            }

        } catch (err) {
            await sock.sendMessage(jid, {
                text: `❌ Error: ${err.message}`
            }, { quoted: message })
        }
    }
}

module.exports = { handler }

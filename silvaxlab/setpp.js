const { downloadMediaMessage } = require('@whiskeysockets/baileys')
const config = require('../config')

const handler = {
    help: ['setpp', 'setgrouppp', 'setgpic'],
    tags: ['group', 'admin'],
    command: /^(setpp|setgrouppp|setgpic|setgroupicon)$/i,
    group: true,
    admin: true,
    botAdmin: true,
    owner: false,

    execute: async ({ jid, sock, message }) => {
        try {
            let msg = message.message
            if (msg?.ephemeralMessage?.message) msg = msg.ephemeralMessage.message
            if (msg?.viewOnceMessage?.message) msg = msg.viewOnceMessage.message
            if (msg?.viewOnceMessageV2?.message) msg = msg.viewOnceMessageV2.message

            const quoted = msg?.extendedTextMessage?.contextInfo?.quotedMessage
            const hasImage = msg?.imageMessage || quoted?.imageMessage

            if (!hasImage) {
                return await sock.sendMessage(jid, {
                    text: `╭━━━━━━━━━━━━━━━━━━━━╮\n┃   🖼️ SET GROUP PIC  ┃\n╰━━━━━━━━━━━━━━━━━━━━╯\n\n*Usage:*\nSend/reply to an image with:\n${config.PREFIX}setpp\n\n_Changes the group profile picture._`
                }, { quoted: message })
            }

            await sock.sendMessage(jid, { react: { text: '⏳', key: message.key } })

            let buffer
            if (msg?.imageMessage) {
                buffer = await downloadMediaMessage(message, 'buffer', {}, {
                    logger: { error: () => {}, warn: () => {}, info: () => {}, debug: () => {} },
                    reuploadRequest: sock.updateMediaMessage
                })
            } else if (quoted?.imageMessage) {
                const quotedMsg = {
                    key: { ...message.key },
                    message: quoted
                }
                buffer = await downloadMediaMessage(quotedMsg, 'buffer', {}, {
                    logger: { error: () => {}, warn: () => {}, info: () => {}, debug: () => {} },
                    reuploadRequest: sock.updateMediaMessage
                })
            }

            if (!buffer) {
                return await sock.sendMessage(jid, { text: '❌ Failed to download image.' }, { quoted: message })
            }

            await sock.updateProfilePicture(jid, buffer)

            await sock.sendMessage(jid, {
                text: '✅ *Group profile picture updated!*'
            }, { quoted: message })

            await sock.sendMessage(jid, { react: { text: '✅', key: message.key } })

        } catch (err) {
            await sock.sendMessage(jid, { text: '❌ Error: ' + err.message }, { quoted: message })
        }
    }
}

module.exports = { handler }

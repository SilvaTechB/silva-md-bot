const config = require('../config')

const handler = {
    help: ['forward', 'fwd'],
    tags: ['owner'],
    command: /^(forward|fwd)$/i,
    group: false,
    admin: false,
    botAdmin: false,
    owner: true,

    execute: async ({ jid, sock, message, args }) => {
        const sender = message.key.participant || message.key.remoteJid

        try {
            const quoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage
            if (!quoted) {
                return sock.sendMessage(jid, {
                    text: `╭━━━━━━━━━━━━━━━━━━━━╮\n┃   📨 FORWARD        ┃\n╰━━━━━━━━━━━━━━━━━━━━╯\n\n*Usage:*\nReply to a message with:\n${config.PREFIX}forward <jid or number>\n\n*Examples:*\n${config.PREFIX}fwd 254700000000\n${config.PREFIX}fwd 120363xxxxx@g.us\n\nForward any message (text, image, video, audio, sticker, document) to another chat.`,
                    contextInfo: createContext(sender)
                }, { quoted: message })
            }

            if (!args[0]) {
                return sock.sendMessage(jid, {
                    text: `❌ Please specify a number or group JID to forward to.\n\n*Example:* ${config.PREFIX}fwd 254700000000`,
                    contextInfo: createContext(sender)
                }, { quoted: message })
            }

            let targetJid = args[0]
            if (!targetJid.includes('@')) {
                targetJid = targetJid.replace(/[^0-9]/g, '') + '@s.whatsapp.net'
            }

            const stanzaId = message.message?.extendedTextMessage?.contextInfo?.stanzaId
            const participant = message.message?.extendedTextMessage?.contextInfo?.participant

            await sock.sendMessage(targetJid, { forward: { key: { remoteJid: jid, id: stanzaId, participant }, message: quoted } })

            await sock.sendMessage(jid, {
                text: `✅ Message forwarded to ${targetJid.split('@')[0]}`,
                contextInfo: createContext(sender)
            }, { quoted: message })

        } catch (err) {
            await sock.sendMessage(jid, {
                text: `❌ Forward failed: ${err.message}`
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
            newsletterName: 'SILVA MD • FORWARD',
            serverMessageId: Math.floor(Math.random() * 1000)
        }
    }
}

module.exports = { handler }

const config = require('../config')

const handler = {
    help: ['delete', 'del'],
    tags: ['utility'],
    command: /^(delete|del)$/i,
    group: false,
    admin: false,
    botAdmin: false,
    owner: false,

    execute: async ({ jid, sock, message }) => {
        try {
            const quoted = message.message?.extendedTextMessage?.contextInfo?.stanzaId
            const quotedParticipant = message.message?.extendedTextMessage?.contextInfo?.participant

            if (!quoted) {
                return sock.sendMessage(jid, {
                    text: `*Usage:* Reply to a bot message with ${config.PREFIX}delete\n\nThis deletes bot messages only.`
                }, { quoted: message })
            }

            const botJid = sock.user.id.split(':')[0] + '@s.whatsapp.net'
            const botLid = sock.user.id

            const isQuotedFromBot = quotedParticipant === botJid || 
                                   quotedParticipant === botLid ||
                                   quotedParticipant?.split(':')[0] === botJid.split('@')[0]

            if (!isQuotedFromBot) {
                return sock.sendMessage(jid, {
                    text: '⚠️ I can only delete my own messages.\nReply to one of my messages to delete it.'
                }, { quoted: message })
            }

            await sock.sendMessage(jid, {
                delete: {
                    remoteJid: jid,
                    fromMe: true,
                    id: quoted,
                    participant: quotedParticipant
                }
            })

        } catch (err) {
            await sock.sendMessage(jid, {
                text: `❌ Error: ${err.message}`
            }, { quoted: message })
        }
    }
}

module.exports = { handler }

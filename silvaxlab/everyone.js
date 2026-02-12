const config = require('../config')

const handler = {
    help: ['everyone <message>', 'hidetag <message>'],
    tags: ['group', 'admin'],
    command: /^(everyone|hidetag|tageveryone)$/i,
    group: true,
    admin: true,
    botAdmin: false,
    owner: false,

    execute: async ({ jid, sock, message, args }) => {
        try {
            const text = args.join(' ') || '📢 Attention everyone!'

            const metadata = await sock.groupMetadata(jid)
            const participants = metadata.participants.map(p => p.id)

            await sock.sendMessage(jid, {
                text: text,
                mentions: participants,
                contextInfo: {
                    forwardingScore: 999,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: '120363200367779016@newsletter',
                        newsletterName: 'SILVA MD GROUP 👥',
                        serverMessageId: 145
                    }
                }
            })

        } catch (err) {
            await sock.sendMessage(jid, { text: '❌ Error: ' + err.message }, { quoted: message })
        }
    }
}

module.exports = { handler }

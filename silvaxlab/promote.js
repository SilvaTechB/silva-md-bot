const config = require('../config')

const handler = {
    help: ['promote', 'demote'],
    tags: ['group', 'admin'],
    command: /^(promote|demote)$/i,
    group: true,
    admin: true,
    botAdmin: true,
    owner: false,

    execute: async ({ jid, sock, message, args, text }) => {
        try {
            const command = text.split(' ')[0].toLowerCase()
            const mentions = message.message?.extendedTextMessage?.contextInfo?.mentionedJid || []
            const quoted = message.message?.extendedTextMessage?.contextInfo?.participant

            let targets = [...mentions]
            if (quoted && !targets.includes(quoted)) {
                targets.push(quoted)
            }

            if (targets.length === 0) {
                return sock.sendMessage(jid, {
                    text: `*Usage:*\n${config.PREFIX}${command} @user\n\n${command === 'promote' ? 'Promotes' : 'Demotes'} the mentioned user.`
                }, { quoted: message })
            }

            const action = command === 'promote' ? 'promote' : 'demote'
            await sock.groupParticipantsUpdate(jid, targets, action)

            const names = targets.map(t => `@${t.split('@')[0]}`).join(', ')
            const emoji = command === 'promote' ? '⬆️' : '⬇️'

            await sock.sendMessage(jid, {
                text: `${emoji} ${command === 'promote' ? 'Promoted' : 'Demoted'}: ${names}`,
                mentions: targets
            }, { quoted: message })

        } catch (err) {
            await sock.sendMessage(jid, {
                text: `❌ Error: ${err.message}`
            }, { quoted: message })
        }
    }
}

module.exports = { handler }

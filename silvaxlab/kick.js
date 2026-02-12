const config = require('../config')

const handler = {
    help: ['kick', 'remove', 'boot'],
    tags: ['group', 'admin'],
    command: /^(kick|remove|boot)$/i,
    group: true,
    admin: true,
    botAdmin: true,
    owner: false,

    execute: async ({ jid, sock, message, args }) => {
        try {
            const sender = message.key.participant || message.key.remoteJid
            const mentions = message.message?.extendedTextMessage?.contextInfo?.mentionedJid || []
            const quoted = message.message?.extendedTextMessage?.contextInfo?.participant

            let targets = [...mentions]
            if (quoted && !targets.includes(quoted)) {
                targets.push(quoted)
            }

            if (targets.length === 0) {
                const numArg = args[0]?.replace(/[^0-9]/g, '')
                if (numArg) {
                    targets.push(numArg + '@s.whatsapp.net')
                }
            }

            if (targets.length === 0) {
                return sock.sendMessage(jid, {
                    text: `*Usage:*\n${config.PREFIX}kick @user\n${config.PREFIX}kick (reply to user)\n\nRemoves mentioned user(s) from the group.`
                }, { quoted: message })
            }

            const botJid = sock.user.id.split(':')[0] + '@s.whatsapp.net'
            targets = targets.filter(t => t !== botJid)

            await sock.groupParticipantsUpdate(jid, targets, 'remove')

            const names = targets.map(t => `@${t.split('@')[0]}`).join(', ')
            await sock.sendMessage(jid, {
                text: `✅ Removed: ${names}`,
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

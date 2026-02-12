const config = require('../config')

const handler = {
    help: ['revoke', 'revokelink'],
    tags: ['group'],
    command: /^(revoke|revokelink)$/i,
    group: true,
    admin: true,
    botAdmin: true,
    owner: false,
    execute: async ({ jid, sock, message, args, text }) => {
        const contextInfo = {
            forwardingScore: 999,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
                newsletterJid: '120363200367779016@newsletter',
                newsletterName: 'SILVA MD BOT',
                serverMessageId: 143
            }
        }

        try {
            await sock.groupRevokeInvite(jid)

            await sock.sendMessage(jid, {
                text: `✅ *Group invite link has been revoked!*\n\nThe old link is no longer valid. A new invite link has been generated.`,
                contextInfo
            }, { quoted: message })
        } catch (err) {
            await sock.sendMessage(jid, {
                text: `❌ Error: ${err.message}`,
                contextInfo
            }, { quoted: message })
        }
    }
}

module.exports = { handler }

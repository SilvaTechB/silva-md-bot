const config = require('../config')

const handler = {
    help: ['anticall'],
    tags: ['owner'],
    command: /^(anticall)$/i,
    group: false,
    admin: false,
    botAdmin: false,
    owner: true,

    execute: async ({ jid, sock, message, args }) => {
        try {
            const action = args[0]?.toLowerCase()

            if (!action || !['on', 'off'].includes(action)) {
                return sock.sendMessage(jid, {
                    text: `╭━━━━━━━━━━━━━━━━━━━━╮
┃   📞 ANTI-CALL      ┃
╰━━━━━━━━━━━━━━━━━━━━╯

📊 *Status:* ${config.ANTI_CALL ? '✅ ENABLED' : '❌ DISABLED'}

*Usage:*
${config.PREFIX}anticall on - Reject all incoming calls
${config.PREFIX}anticall off - Allow incoming calls

_When enabled, all calls (except from owner) are auto-rejected with a message._`
                }, { quoted: message })
            }

            if (action === 'on') {
                config.ANTI_CALL = true
                await sock.sendMessage(jid, {
                    text: '✅ *Anti-Call ENABLED*\n\nAll incoming calls will be automatically rejected.'
                }, { quoted: message })
            } else {
                config.ANTI_CALL = false
                await sock.sendMessage(jid, {
                    text: '❌ *Anti-Call DISABLED*\n\nIncoming calls are now allowed.'
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

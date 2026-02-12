const config = require('../config')

const antilinkGroups = new Set()

const handler = {
    help: ['antilink'],
    tags: ['group', 'admin'],
    command: /^(antilink)$/i,
    group: true,
    admin: true,
    botAdmin: true,
    owner: false,

    execute: async ({ jid, sock, message, args }) => {
        try {
            const action = args[0]?.toLowerCase()

            if (!action || !['on', 'off'].includes(action)) {
                return sock.sendMessage(jid, {
                    text: `╭━━━━━━━━━━━━━━━━━━━━╮
┃   🔗 ANTI-LINK       ┃
╰━━━━━━━━━━━━━━━━━━━━╯

📊 *Status:* ${antilinkGroups.has(jid) ? '✅ ENABLED' : '❌ DISABLED'}

*Usage:*
${config.PREFIX}antilink on - Enable (deletes messages with links)
${config.PREFIX}antilink off - Disable

_When enabled, messages containing links from non-admins will be deleted and the sender warned._`
                }, { quoted: message })
            }

            if (action === 'on') {
                antilinkGroups.add(jid)
                await sock.sendMessage(jid, {
                    text: '✅ *Anti-Link ENABLED*\n\nMessages with links from non-admins will be deleted.'
                }, { quoted: message })
            } else {
                antilinkGroups.delete(jid)
                await sock.sendMessage(jid, {
                    text: '❌ *Anti-Link DISABLED*'
                }, { quoted: message })
            }

        } catch (err) {
            await sock.sendMessage(jid, {
                text: `❌ Error: ${err.message}`
            }, { quoted: message })
        }
    }
}

module.exports = { handler, antilinkGroups }

const config = require('../config')
const { delay } = require('@whiskeysockets/baileys')

const handler = {
    help: ['broadcast', 'bc'],
    tags: ['owner'],
    command: /^(broadcast|bc)$/i,
    group: false,
    admin: false,
    botAdmin: false,
    owner: true,

    execute: async ({ jid, sock, message, args }) => {
        try {
            const text = args.join(' ').trim()

            if (!text) {
                return sock.sendMessage(jid, {
                    text: `╭━━━━━━━━━━━━━━━━━━━━╮
┃   📢 BROADCAST       ┃
╰━━━━━━━━━━━━━━━━━━━━╯

*Usage:*
${config.PREFIX}broadcast <message>

Sends a message to all groups the bot is in.
⚠️ Owner only command.`
                }, { quoted: message })
            }

            await sock.sendMessage(jid, { text: '📢 Broadcasting message to all groups...' }, { quoted: message })

            const groups = await sock.groupFetchAllParticipating()
            const groupIds = Object.keys(groups)

            const broadcastMsg = `╭━━━━━━━━━━━━━━━━━━━━╮
┃   📢 BROADCAST       ┃
╰━━━━━━━━━━━━━━━━━━━━╯

${text}

_📡 Broadcast from ${config.BOT_NAME || 'Silva MD'}_`

            let sent = 0
            let failed = 0

            for (const groupId of groupIds) {
                try {
                    await sock.sendMessage(groupId, { text: broadcastMsg })
                    sent++
                    await delay(1000)
                } catch (e) {
                    failed++
                }
            }

            await sock.sendMessage(jid, {
                text: `✅ *Broadcast Complete*\n\n📨 Sent: ${sent} groups\n❌ Failed: ${failed} groups\n📊 Total: ${groupIds.length} groups`
            })

        } catch (err) {
            await sock.sendMessage(jid, {
                text: `❌ Error: ${err.message}`
            }, { quoted: message })
        }
    }
}

module.exports = { handler }

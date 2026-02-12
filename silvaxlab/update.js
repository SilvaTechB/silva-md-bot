const config = require('../config')
const updater = require('../lib/updater')

const handler = {
    help: ['update - Check for bot updates from GitHub'],
    tags: ['owner', 'system'],
    command: /^(update|upgrade|checkupdate)$/i,
    group: false,
    admin: false,
    botAdmin: false,
    owner: true,

    execute: async ({ jid, sock, message, args, bot }) => {
        try {
            const status = updater.getStatus()

            if (args[0] === 'status') {
                const lastCheckStr = status.lastCheck
                    ? new Date(status.lastCheck).toLocaleString()
                    : 'Never'

                return await sock.sendMessage(jid, {
                    text: `╭━━━━━━━━━━━━━━━━━━━━╮\n┃   🔄 AUTO-UPDATE    ┃\n╰━━━━━━━━━━━━━━━━━━━━╯\n\n📦 Repo: ${status.repo}\n🌿 Branch: ${status.branch}\n⏱ Interval: ${status.interval}\n🕐 Last Check: ${lastCheckStr}\n🔄 Updating: ${status.isUpdating ? 'Yes' : 'No'}\n\n_Auto-update is always running._`
                }, { quoted: message })
            }

            await sock.sendMessage(jid, {
                text: '🔄 Checking for updates from GitHub...'
            }, { quoted: message })

            await sock.sendMessage(jid, { react: { text: '🔄', key: message.key } })

            const result = await updater.checkForUpdates(
                (level, msg) => console.log(`[${level}] ${msg}`)
            )

            let responseText = '╭━━━━━━━━━━━━━━━━━━━━╮\n┃   🔄 UPDATE RESULT  ┃\n╰━━━━━━━━━━━━━━━━━━━━╯\n\n'

            if (result.updated.length > 0) {
                responseText += `*📝 Updated (${result.updated.length}):*\n`
                for (const f of result.updated) {
                    responseText += `  ✅ ${f}\n`
                }
                responseText += '\n'
            }

            if (result.added.length > 0) {
                responseText += `*🆕 New (${result.added.length}):*\n`
                for (const f of result.added) {
                    responseText += `  ➕ ${f}\n`
                }
                responseText += '\n'
            }

            if (result.updated.length === 0 && result.added.length === 0) {
                responseText += '✅ Everything is up to date!\n'
            }

            if (result.updated.length > 0 || result.added.length > 0) {
                responseText += '\n_Reloading plugins..._'
                if (bot && bot.pluginManager) {
                    await bot.pluginManager.loadPlugins('silvaxlab')
                    responseText += '\n✅ Plugins reloaded!'
                }
            }

            await sock.sendMessage(jid, { text: responseText }, { quoted: message })
            await sock.sendMessage(jid, { react: { text: '✅', key: message.key } })

        } catch (err) {
            console.error('UPDATE ERROR:', err)
            await sock.sendMessage(jid, {
                text: '❌ Update check failed: ' + err.message
            }, { quoted: message })
        }
    }
}

module.exports = { handler }

const config = require('../config')

const antiBotGroups = new Set()

const handler = {
    help: ['antibot'],
    tags: ['group', 'admin'],
    command: /^(antibot)$/i,
    group: true,
    admin: true,
    botAdmin: true,
    owner: false,

    execute: async ({ jid, sock, message, args }) => {
        try {
            const action = args[0]?.toLowerCase()

            if (!action || !['on', 'off'].includes(action)) {
                return sock.sendMessage(jid, {
                    text: `╭━━━━━━━━━━━━━━━━━━━━╮\n┃   🤖 ANTI-BOT       ┃\n╰━━━━━━━━━━━━━━━━━━━━╯\n\n📊 *Status:* ${antiBotGroups.has(jid) ? '✅ ENABLED' : '❌ DISABLED'}\n\n*Usage:*\n${config.PREFIX}antibot on - Enable (kicks other bots)\n${config.PREFIX}antibot off - Disable\n\n_When enabled, bots added to the group will be automatically removed._`,
                    contextInfo: {
                        forwardingScore: 999,
                        isForwarded: true,
                        forwardedNewsletterMessageInfo: {
                            newsletterJid: '120363200367779016@newsletter',
                            newsletterName: 'SILVA MD BOT',
                            serverMessageId: 143
                        }
                    }
                }, { quoted: message })
            }

            if (action === 'on') {
                antiBotGroups.add(jid)
                await sock.sendMessage(jid, {
                    text: '✅ *Anti-Bot ENABLED*\n\nOther bots added to this group will be automatically removed.\n\n_Note: Only Silva MD Bot is allowed._'
                }, { quoted: message })
            } else {
                antiBotGroups.delete(jid)
                await sock.sendMessage(jid, {
                    text: '❌ *Anti-Bot DISABLED*'
                }, { quoted: message })
            }

        } catch (err) {
            await sock.sendMessage(jid, {
                text: `❌ Error: ${err.message}`
            }, { quoted: message })
        }
    }
}

module.exports = { handler, antiBotGroups }

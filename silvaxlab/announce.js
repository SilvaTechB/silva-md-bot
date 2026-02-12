const config = require('../config')

const handler = {
    help: ['announce'],
    tags: ['group'],
    command: /^(announce)$/i,
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
            const action = args[0]?.toLowerCase()

            if (!action || !['on', 'off'].includes(action)) {
                return sock.sendMessage(jid, {
                    text: `📢 *Announce Usage:*\n\n${config.PREFIX}announce on - Only admins can send messages\n${config.PREFIX}announce off - All members can send messages`,
                    contextInfo
                }, { quoted: message })
            }

            if (action === 'on') {
                await sock.groupSettingUpdate(jid, 'announcement')
                await sock.sendMessage(jid, {
                    text: `📢 *Announcement Mode ON*\n\nOnly admins can send messages now.`,
                    contextInfo
                }, { quoted: message })
            } else {
                await sock.groupSettingUpdate(jid, 'not_announcement')
                await sock.sendMessage(jid, {
                    text: `📢 *Announcement Mode OFF*\n\nAll members can send messages now.`,
                    contextInfo
                }, { quoted: message })
            }
        } catch (err) {
            await sock.sendMessage(jid, {
                text: `❌ Error: ${err.message}`,
                contextInfo
            }, { quoted: message })
        }
    }
}

module.exports = { handler }

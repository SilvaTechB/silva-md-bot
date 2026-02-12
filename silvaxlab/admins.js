const config = require('../config')

const handler = {
    help: ['admins', 'listadmins'],
    tags: ['group'],
    command: /^(admins|listadmins)$/i,
    group: true,
    admin: false,
    botAdmin: false,
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
            const metadata = await sock.groupMetadata(jid)
            const admins = metadata.participants.filter(p => p.admin === 'admin' || p.admin === 'superadmin')

            if (!admins.length) {
                return sock.sendMessage(jid, {
                    text: `❌ No admins found in this group.`,
                    contextInfo
                }, { quoted: message })
            }

            const mentions = admins.map(a => a.id)
            const adminList = admins.map((a, i) => {
                const role = a.admin === 'superadmin' ? '👑 Super Admin' : '🛡️ Admin'
                return `${i + 1}. @${a.id.split('@')[0]} - ${role}`
            }).join('\n')

            await sock.sendMessage(jid, {
                text: `╭━━━━━━━━━━━━━━━━━━━━╮\n┃   👥 GROUP ADMINS    ┃\n╰━━━━━━━━━━━━━━━━━━━━╯\n\n📛 *${metadata.subject}*\n👥 *Total Admins:* ${admins.length}\n\n${adminList}`,
                mentions,
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

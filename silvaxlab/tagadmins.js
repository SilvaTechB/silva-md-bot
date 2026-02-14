const config = require('../config')

const handler = {
    help: ['tagadmins', 'admintag'],
    tags: ['group'],
    command: /^(tagadmins|admintag)$/i,
    group: true,
    admin: false,
    botAdmin: false,
    owner: false,

    execute: async ({ jid, sock, message, args }) => {
        const sender = message.key.participant || message.key.remoteJid

        try {
            const metadata = await sock.groupMetadata(jid)
            const admins = metadata.participants.filter(p => p.admin)

            if (admins.length === 0) {
                return sock.sendMessage(jid, {
                    text: '❌ No admins found.',
                    contextInfo: createContext(sender)
                }, { quoted: message })
            }

            const customMsg = args.join(' ') || '📢 Attention admins!'
            const adminJids = admins.map(a => a.id)

            let text = `╭━━━━━━━━━━━━━━━━━━━━╮\n┃   👑 ADMINS TAG      ┃\n╰━━━━━━━━━━━━━━━━━━━━╯\n\n${customMsg}\n\n`
            admins.forEach((admin, i) => {
                const role = admin.admin === 'superadmin' ? '👑 Super Admin' : '🛡️ Admin'
                text += `${i + 1}. @${admin.id.split('@')[0]} (${role})\n`
            })

            await sock.sendMessage(jid, {
                text,
                mentions: adminJids,
                contextInfo: createContext(sender)
            }, { quoted: message })

        } catch (err) {
            await sock.sendMessage(jid, {
                text: `❌ Error: ${err.message}`
            }, { quoted: message })
        }
    }
}

function createContext(sender) {
    return {
        mentionedJid: [sender],
        forwardingScore: 999,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
            newsletterJid: '120363200367779016@newsletter',
            newsletterName: 'SILVA MD • ADMINS',
            serverMessageId: Math.floor(Math.random() * 1000)
        }
    }
}

module.exports = { handler }

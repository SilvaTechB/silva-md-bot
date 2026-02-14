const config = require('../config')

const handler = {
    help: ['clearall', 'purge'],
    tags: ['group', 'admin'],
    command: /^(clearall|purge)$/i,
    group: true,
    admin: true,
    botAdmin: true,
    owner: false,

    execute: async ({ jid, sock, message, args }) => {
        const sender = message.key.participant || message.key.remoteJid

        try {
            const metadata = await sock.groupMetadata(jid)
            const botJid = sock.user?.id?.split(':')[0] + '@s.whatsapp.net'
            const ownerJid = sender
            const participants = metadata.participants

            const nonAdminMembers = participants.filter(p => {
                if (p.admin) return false
                if (p.id === botJid) return false
                const pNum = p.id.split('@')[0].split(':')[0].replace(/[^0-9]/g, '')
                const senderNum = sender.split('@')[0].split(':')[0].replace(/[^0-9]/g, '')
                if (pNum === senderNum) return false
                return true
            })

            if (nonAdminMembers.length === 0) {
                return sock.sendMessage(jid, {
                    text: '✅ No non-admin members to remove.',
                    contextInfo: createContext(sender)
                }, { quoted: message })
            }

            const confirm = args[0]?.toLowerCase()
            if (confirm !== 'confirm') {
                return sock.sendMessage(jid, {
                    text: `╭━━━━━━━━━━━━━━━━━━━━╮\n┃   ⚠️ CLEAR ALL       ┃\n╰━━━━━━━━━━━━━━━━━━━━╯\n\n⚠️ This will remove *${nonAdminMembers.length}* non-admin member(s) from this group.\n\nAdmins and the bot will NOT be removed.\n\nTo confirm, type:\n${config.PREFIX}clearall confirm`,
                    contextInfo: createContext(sender)
                }, { quoted: message })
            }

            await sock.sendMessage(jid, {
                text: `🔄 Removing ${nonAdminMembers.length} non-admin members...`,
                contextInfo: createContext(sender)
            }, { quoted: message })

            const batchSize = 5
            let removed = 0
            for (let i = 0; i < nonAdminMembers.length; i += batchSize) {
                const batch = nonAdminMembers.slice(i, i + batchSize).map(p => p.id)
                try {
                    await sock.groupParticipantsUpdate(jid, batch, 'remove')
                    removed += batch.length
                    await new Promise(r => setTimeout(r, 2000))
                } catch (e) {
                    console.error('[CLEARALL] Batch remove failed:', e.message)
                }
            }

            await sock.sendMessage(jid, {
                text: `✅ *Clear All Complete*\n\nRemoved ${removed}/${nonAdminMembers.length} non-admin members.`,
                contextInfo: createContext(sender)
            })

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
            newsletterName: 'SILVA MD • CLEAR',
            serverMessageId: Math.floor(Math.random() * 1000)
        }
    }
}

module.exports = { handler }

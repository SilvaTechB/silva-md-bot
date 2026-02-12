const config = require('../config')
const os = require('os')

const handler = {
    help: ['owner', 'creator', 'dev'],
    tags: ['main'],
    command: /^(owner|creator|dev)$/i,
    group: false,
    admin: false,
    botAdmin: false,
    owner: false,

    execute: async ({ jid, sock, message }) => {
        try {
            const sender = message.key.participant || message.key.remoteJid
            const ownerNum = config.OWNER_NUMBER || ''
            const cleanNum = ownerNum.replace(/[^0-9]/g, '')

            const vcard = `BEGIN:VCARD
VERSION:3.0
N:;Silva MD Bot Owner;;;
FN:Silva MD Bot Owner
item1.TEL;waid=${cleanNum}:+${cleanNum}
item1.X-ABLabel:Owner
X-WA-BIZ-NAME:Silva MD Bot
END:VCARD`

            await sock.sendMessage(jid, {
                contacts: {
                    displayName: 'Silva MD Owner',
                    contacts: [{
                        vcard
                    }]
                }
            }, { quoted: message })

            await sock.sendMessage(jid, {
                text: `╭━━━━━━━━━━━━━━━━━━━━╮
┃   👑 BOT OWNER       ┃
╰━━━━━━━━━━━━━━━━━━━━╯

🤖 *Bot:* ${config.BOT_NAME || 'Silva MD'}
👤 *Owner:* +${cleanNum || 'Not Set'}
⚙️ *Version:* ${config.VERSION || '3.0.0'}
📡 *Mode:* ${config.BOT_MODE || 'public'}
🔌 *Prefix:* ${config.PREFIX}

🌐 *GitHub:* ${config.GITHUB || 'github.com/SilvaTechB'}
💬 *Channel:* wa.me/channel/0029VaAkETLLY6d8qhLmZt2v

_Powered by Silva MD Bot_`,
                contextInfo: {
                    mentionedJid: [sender],
                    forwardingScore: 999,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: '120363200367779016@newsletter',
                        newsletterName: 'SILVA MD • INFO',
                        serverMessageId: Math.floor(Math.random() * 1000)
                    }
                }
            }, { quoted: message })

        } catch (err) {
            await sock.sendMessage(jid, {
                text: `❌ Error: ${err.message}`
            }, { quoted: message })
        }
    }
}

module.exports = { handler }

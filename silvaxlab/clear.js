const config = require('../config')
const { delay } = require('@whiskeysockets/baileys')

const handler = {
    help: ['clear', 'purge'],
    tags: ['group', 'admin'],
    command: /^(clear|purge)$/i,
    group: true,
    admin: true,
    botAdmin: false,
    owner: false,

    execute: async ({ jid, sock, message }) => {
        try {
            await sock.sendMessage(jid, {
                text: `╭━━━━━━━━━━━━━━━━━━━━╮
┃   🧹 CHAT CLEARED    ┃
╰━━━━━━━━━━━━━━━━━━━━╯

Chat has been cleared.

.
.
.
.
.
.
.
.
.
.
.
.
.
.
.
.
.
.
.
.
.
.
.
.
.
.
.
.
.
.

_Silva MD Bot_`
            }, { quoted: message })
        } catch (err) {
            await sock.sendMessage(jid, {
                text: `❌ Error: ${err.message}`
            }, { quoted: message })
        }
    }
}

module.exports = { handler }

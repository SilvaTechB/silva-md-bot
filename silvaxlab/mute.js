const config = require('../config')

const handler = {
    help: ['mute', 'unmute'],
    tags: ['group', 'admin'],
    command: /^(mute|unmute|close|open)$/i,
    group: true,
    admin: true,
    botAdmin: true,
    owner: false,

    execute: async ({ jid, sock, message, text }) => {
        try {
            const command = text.split(' ')[0].toLowerCase()
            const shouldMute = command === 'mute' || command === 'close'

            await sock.groupSettingUpdate(jid, shouldMute ? 'announcement' : 'not_announcement')

            await sock.sendMessage(jid, {
                text: shouldMute
                    ? `🔇 *Group Muted*\n\nOnly admins can send messages now.`
                    : `🔊 *Group Unmuted*\n\nAll members can send messages now.`,
                contextInfo: {
                    forwardingScore: 999,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: '120363200367779016@newsletter',
                        newsletterName: 'SILVA MD GROUP 👥',
                        serverMessageId: 145
                    }
                }
            }, { quoted: message })

        } catch (err) {
            await sock.sendMessage(jid, { text: '❌ Error: ' + err.message }, { quoted: message })
        }
    }
}

module.exports = { handler }

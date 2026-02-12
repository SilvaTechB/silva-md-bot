const config = require('../config')

const handler = {
    help: ['pp @user', 'dp @user', 'profilepic'],
    tags: ['utility'],
    command: /^(pp|dp|profilepic|pfp)$/i,
    group: false,
    admin: false,
    botAdmin: false,
    owner: false,

    execute: async ({ jid, sock, message, args }) => {
        try {
            const sender = message.key.participant || message.key.remoteJid
            const mentions = message.message?.extendedTextMessage?.contextInfo?.mentionedJid || []
            const quoted = message.message?.extendedTextMessage?.contextInfo?.participant

            let targetJid = sender
            if (mentions.length > 0) {
                targetJid = mentions[0]
            } else if (quoted) {
                targetJid = quoted
            } else if (args[0]) {
                const num = args[0].replace(/[^0-9]/g, '')
                if (num.length >= 7) targetJid = num + '@s.whatsapp.net'
            }

            let ppUrl
            try {
                ppUrl = await sock.profilePictureUrl(targetJid, 'image')
            } catch (e) {
                return await sock.sendMessage(jid, {
                    text: `❌ No profile picture found for @${targetJid.split('@')[0]}`,
                    mentions: [targetJid]
                }, { quoted: message })
            }

            await sock.sendMessage(jid, {
                image: { url: ppUrl },
                caption: `📸 *Profile Picture*\n👤 @${targetJid.split('@')[0]}`,
                mentions: [targetJid],
                contextInfo: {
                    forwardingScore: 999,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: '120363200367779016@newsletter',
                        newsletterName: 'SILVA MD TOOLS 🔧',
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

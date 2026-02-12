const config = require('../config')

const handler = {
    help: ['gdesc', 'setdesc'],
    tags: ['group'],
    command: /^(gdesc|setdesc)$/i,
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
            const description = args.join(' ').trim()

            if (!description) {
                const metadata = await sock.groupMetadata(jid)
                const currentDesc = metadata.desc || 'No description set.'

                return sock.sendMessage(jid, {
                    text: `📝 *Current Group Description:*\n\n${currentDesc}\n\n_Use ${config.PREFIX}gdesc <text> to change it._`,
                    contextInfo
                }, { quoted: message })
            }

            await sock.groupUpdateDescription(jid, description)

            await sock.sendMessage(jid, {
                text: `✅ *Group description updated successfully!*`,
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

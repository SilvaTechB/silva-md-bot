const config = require('../config')

const handler = {
    help: ['poll'],
    tags: ['group'],
    command: /^(poll)$/i,
    group: true,
    admin: false,
    botAdmin: false,
    owner: false,
    execute: async ({ jid, sock, message, args, text }) => {
        try {
            const fullText = args.join(' ')
            const parts = fullText.split('|').map(p => p.trim()).filter(p => p)

            if (parts.length < 3) {
                return sock.sendMessage(jid, {
                    text: `📊 *Poll Usage:*\n\n${config.PREFIX}poll Question | Option1 | Option2 | Option3\n\n_Provide a question and at least 2 options separated by |_`,
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

            const question = parts[0]
            const options = parts.slice(1)

            await sock.sendMessage(jid, {
                poll: {
                    name: question,
                    values: options,
                    selectableCount: 1
                }
            })
        } catch (err) {
            await sock.sendMessage(jid, {
                text: `❌ Error: ${err.message}`
            }, { quoted: message })
        }
    }
}

module.exports = { handler }

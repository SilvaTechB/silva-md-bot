const config = require('../config')

const responses = [
    { text: "It is certain.", type: "positive" },
    { text: "It is decidedly so.", type: "positive" },
    { text: "Without a doubt.", type: "positive" },
    { text: "Yes, definitely.", type: "positive" },
    { text: "You may rely on it.", type: "positive" },
    { text: "As I see it, yes.", type: "positive" },
    { text: "Most likely.", type: "positive" },
    { text: "Outlook good.", type: "positive" },
    { text: "Yes.", type: "positive" },
    { text: "Signs point to yes.", type: "positive" },
    { text: "Reply hazy, try again.", type: "neutral" },
    { text: "Ask again later.", type: "neutral" },
    { text: "Better not tell you now.", type: "neutral" },
    { text: "Cannot predict now.", type: "neutral" },
    { text: "Concentrate and ask again.", type: "neutral" },
    { text: "Don't count on it.", type: "negative" },
    { text: "My reply is no.", type: "negative" },
    { text: "My sources say no.", type: "negative" },
    { text: "Outlook not so good.", type: "negative" },
    { text: "Very doubtful.", type: "negative" }
]

const handler = {
    help: ['8ball <question>'],
    tags: ['fun'],
    command: /^(8ball|ball|magic8ball|eightball)$/i,
    group: false,
    admin: false,
    botAdmin: false,
    owner: false,

    execute: async ({ jid, sock, message, args }) => {
        try {
            const question = args.join(' ')
            if (!question) {
                return await sock.sendMessage(jid, {
                    text: `🎱 *Magic 8-Ball*\n\nAsk me a yes/no question!\n\n*Usage:* ${config.PREFIX}8ball Will I be rich?`
                }, { quoted: message })
            }

            const response = responses[Math.floor(Math.random() * responses.length)]
            const emoji = response.type === 'positive' ? '✅' : response.type === 'negative' ? '❌' : '🤔'

            await sock.sendMessage(jid, {
                text: `╭━━━━━━━━━━━━━━━━━━━━╮
┃   🎱 MAGIC 8-BALL   ┃
╰━━━━━━━━━━━━━━━━━━━━╯

❓ *Question:* ${question}

${emoji} *Answer:* ${response.text}

_The magic 8-ball has spoken!_ 🔮`,
                contextInfo: {
                    forwardingScore: 999,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: '120363200367779016@newsletter',
                        newsletterName: 'SILVA MD GAMES 🎮',
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

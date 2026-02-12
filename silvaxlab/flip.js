const config = require('../config')

const handler = {
    help: ['flip', 'coinflip', 'coin'],
    tags: ['fun', 'game'],
    command: /^(flip|coinflip|coin|toss)$/i,
    group: false,
    admin: false,
    botAdmin: false,
    owner: false,

    execute: async ({ jid, sock, message, args }) => {
        try {
            const choice = args[0]?.toLowerCase()
            const result = Math.random() > 0.5 ? 'heads' : 'tails'
            const emoji = result === 'heads' ? '🪙' : '💰'

            let resultText = `╭━━━━━━━━━━━━━━━━━━━━╮
┃   🪙 COIN FLIP      ┃
╰━━━━━━━━━━━━━━━━━━━━╯

*Flipping...*

${emoji} Result: *${result.toUpperCase()}*`

            if (choice && (choice === 'heads' || choice === 'tails' || choice === 'h' || choice === 't')) {
                const userChoice = (choice === 'h' || choice === 'heads') ? 'heads' : 'tails'
                const won = userChoice === result
                resultText += `\n\n🎯 Your pick: *${userChoice.toUpperCase()}*\n${won ? '🎉 *YOU WIN!*' : '😢 *YOU LOSE!*'}`
            } else {
                resultText += `\n\n_Bet on it! Use: ${config.PREFIX}flip heads/tails_`
            }

            await sock.sendMessage(jid, {
                text: resultText,
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

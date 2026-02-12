const config = require('../config')

const handler = {
    help: ['rps <rock/paper/scissors>'],
    tags: ['fun', 'game'],
    command: /^(rps|rockpaperscissors)$/i,
    group: false,
    admin: false,
    botAdmin: false,
    owner: false,

    execute: async ({ jid, sock, message, args }) => {
        try {
            const choices = ['rock', 'paper', 'scissors']
            const emojis = { rock: '🪨', paper: '📄', scissors: '✂️' }
            const userChoice = args[0]?.toLowerCase()

            if (!userChoice || !choices.includes(userChoice)) {
                return await sock.sendMessage(jid, {
                    text: `╭━━━━━━━━━━━━━━━━━━━━╮
┃ ✊ ROCK PAPER SCISSORS┃
╰━━━━━━━━━━━━━━━━━━━━╯

*Usage:*
${config.PREFIX}rps rock
${config.PREFIX}rps paper
${config.PREFIX}rps scissors

_Choose wisely!_ ✊📄✂️`
                }, { quoted: message })
            }

            const botChoice = choices[Math.floor(Math.random() * 3)]

            let result
            if (userChoice === botChoice) {
                result = "🤝 *It's a TIE!*"
            } else if (
                (userChoice === 'rock' && botChoice === 'scissors') ||
                (userChoice === 'paper' && botChoice === 'rock') ||
                (userChoice === 'scissors' && botChoice === 'paper')
            ) {
                result = "🎉 *YOU WIN!*"
            } else {
                result = "😢 *YOU LOSE!*"
            }

            await sock.sendMessage(jid, {
                text: `╭━━━━━━━━━━━━━━━━━━━━╮
┃ ✊ ROCK PAPER SCISSORS┃
╰━━━━━━━━━━━━━━━━━━━━╯

You: ${emojis[userChoice]} *${userChoice.toUpperCase()}*
Bot: ${emojis[botChoice]} *${botChoice.toUpperCase()}*

${result}

_Play again with ${config.PREFIX}rps!_`,
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

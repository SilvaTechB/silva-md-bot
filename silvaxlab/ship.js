const config = require('../config')

const handler = {
    help: ['ship @user1 @user2'],
    tags: ['fun', 'game'],
    command: /^(ship|love|lovemeter|match)$/i,
    group: false,
    admin: false,
    botAdmin: false,
    owner: false,

    execute: async ({ jid, sock, message, args }) => {
        try {
            const mentions = message.message?.extendedTextMessage?.contextInfo?.mentionedJid || []
            const sender = message.key.participant || message.key.remoteJid

            let user1, user2

            if (mentions.length >= 2) {
                user1 = mentions[0]
                user2 = mentions[1]
            } else if (mentions.length === 1) {
                user1 = sender
                user2 = mentions[0]
            } else {
                return await sock.sendMessage(jid, {
                    text: `╭━━━━━━━━━━━━━━━━━━━━╮
┃   💕 LOVE METER     ┃
╰━━━━━━━━━━━━━━━━━━━━╯

*Usage:*
${config.PREFIX}ship @user1 @user2
${config.PREFIX}ship @user (ships with you)

_Find out your love compatibility!_`
                }, { quoted: message })
            }

            const percentage = Math.floor(Math.random() * 101)
            let emoji, comment

            if (percentage >= 90) {
                emoji = '💖💖💖💖💖'
                comment = "Perfect match! You two are soulmates! 💍"
            } else if (percentage >= 70) {
                emoji = '💖💖💖💖🤍'
                comment = "Great chemistry! There's definitely something here! 🥰"
            } else if (percentage >= 50) {
                emoji = '💖💖💖🤍🤍'
                comment = "Not bad! There's potential with some effort! 😊"
            } else if (percentage >= 30) {
                emoji = '💖💖🤍🤍🤍'
                comment = "Hmm, it's complicated... Maybe just friends? 🤔"
            } else if (percentage >= 10) {
                emoji = '💖🤍🤍🤍🤍'
                comment = "Oof, this ship is sinking! 😬"
            } else {
                emoji = '🤍🤍🤍🤍🤍'
                comment = "Sorry, this ain't it! Better luck elsewhere! 💔"
            }

            const bar = '█'.repeat(Math.floor(percentage / 10)) + '░'.repeat(10 - Math.floor(percentage / 10))

            await sock.sendMessage(jid, {
                text: `╭━━━━━━━━━━━━━━━━━━━━╮
┃   💕 LOVE METER     ┃
╰━━━━━━━━━━━━━━━━━━━━╯

👤 @${user1.split('@')[0]}
❤️ × ❤️
👤 @${user2.split('@')[0]}

${emoji}

┃ ${bar} ┃ *${percentage}%*

💬 ${comment}`,
                mentions: [user1, user2],
                contextInfo: {
                    mentionedJid: [user1, user2],
                    forwardingScore: 999,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: '120363200367779016@newsletter',
                        newsletterName: 'SILVA MD LOVE 💕',
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

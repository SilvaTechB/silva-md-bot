const config = require('../config')
const { bannedUsers } = require('./ban')

const handler = {
    help: ['checkban', 'iban'],
    tags: ['utility'],
    command: /^(checkban|iban)$/i,
    group: false,
    admin: false,
    botAdmin: false,
    owner: false,

    execute: async ({ jid, sock, message, args }) => {
        try {
            const sender = message.key.participant || message.key.remoteJid
            const mentions = message.message?.extendedTextMessage?.contextInfo?.mentionedJid || []
            const numArg = args[0]?.replace(/[^0-9]/g, '')

            let targetJid = null
            if (mentions.length > 0) {
                targetJid = mentions[0]
            } else if (numArg && numArg.length >= 7) {
                targetJid = numArg + '@s.whatsapp.net'
            } else {
                targetJid = sender
            }

            const isBanned = bannedUsers.has(targetJid)
            const targetName = targetJid.split('@')[0]
            const isSelf = targetJid === sender

            let statusText
            if (isSelf) {
                statusText = isBanned
                    ? `🚫 *You are BANNED*\n\nYou are currently banned from using ${config.BOT_NAME || 'Silva MD'}.\n\nContact the bot owner to get unbanned.`
                    : `✅ *You are NOT banned*\n\nYou can use all ${config.BOT_NAME || 'Silva MD'} commands freely.`
            } else {
                statusText = isBanned
                    ? `🚫 *@${targetName} is BANNED*\n\nThis user is currently banned from using ${config.BOT_NAME || 'Silva MD'}.`
                    : `✅ *@${targetName} is NOT banned*\n\nThis user can use all bot commands freely.`
            }

            await sock.sendMessage(jid, {
                text: `╭━━━━━━━━━━━━━━━━━━━━╮
┃   🔍 BAN CHECK      ┃
╰━━━━━━━━━━━━━━━━━━━━╯

${statusText}

📊 *Total Banned Users:* ${bannedUsers.size}`,
                mentions: [targetJid],
                contextInfo: {
                    mentionedJid: [targetJid],
                    forwardingScore: 999,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: '120363200367779016@newsletter',
                        newsletterName: 'SILVA MD',
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

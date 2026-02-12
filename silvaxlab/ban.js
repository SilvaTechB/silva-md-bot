const config = require('../config')

const bannedUsers = new Set()

const handler = {
    help: ['ban', 'unban', 'banlist'],
    tags: ['owner'],
    command: /^(ban|unban|banlist)$/i,
    group: false,
    admin: false,
    botAdmin: false,
    owner: true,

    execute: async ({ jid, sock, message, args, text }) => {
        try {
            const sender = message.key.participant || message.key.remoteJid
            const command = text.split(' ')[0].toLowerCase()

            switch (command) {
                case 'ban': {
                    const mentions = message.message?.extendedTextMessage?.contextInfo?.mentionedJid || []
                    const numArg = args[0]?.replace(/[^0-9]/g, '')

                    let targetJid = null
                    if (mentions.length > 0) {
                        targetJid = mentions[0]
                    } else if (numArg) {
                        targetJid = numArg + '@s.whatsapp.net'
                    }

                    if (!targetJid) {
                        return sock.sendMessage(jid, {
                            text: `*Usage:*\n${config.PREFIX}ban @user\n${config.PREFIX}ban <number>`
                        }, { quoted: message })
                    }

                    bannedUsers.add(targetJid)
                    const bannedName = targetJid.split('@')[0]

                    await sock.sendMessage(jid, {
                        text: `🚫 *User Banned*\n\n@${bannedName} has been banned from using the bot.`,
                        mentions: [targetJid]
                    }, { quoted: message })
                    break
                }

                case 'unban': {
                    const mentions = message.message?.extendedTextMessage?.contextInfo?.mentionedJid || []
                    const numArg = args[0]?.replace(/[^0-9]/g, '')

                    let targetJid = null
                    if (mentions.length > 0) {
                        targetJid = mentions[0]
                    } else if (numArg) {
                        targetJid = numArg + '@s.whatsapp.net'
                    }

                    if (!targetJid) {
                        return sock.sendMessage(jid, {
                            text: `*Usage:*\n${config.PREFIX}unban @user`
                        }, { quoted: message })
                    }

                    bannedUsers.delete(targetJid)
                    const unbannedName = targetJid.split('@')[0]

                    await sock.sendMessage(jid, {
                        text: `✅ *User Unbanned*\n\n@${unbannedName} can use the bot again.`,
                        mentions: [targetJid]
                    }, { quoted: message })
                    break
                }

                case 'banlist': {
                    if (bannedUsers.size === 0) {
                        return sock.sendMessage(jid, {
                            text: '✅ No banned users.'
                        }, { quoted: message })
                    }

                    const list = [...bannedUsers]
                        .map((u, i) => `${i + 1}. @${u.split('@')[0]}`)
                        .join('\n')

                    await sock.sendMessage(jid, {
                        text: `🚫 *Banned Users (${bannedUsers.size}):*\n\n${list}`,
                        mentions: [...bannedUsers]
                    }, { quoted: message })
                    break
                }
            }

        } catch (err) {
            await sock.sendMessage(jid, {
                text: `❌ Error: ${err.message}`
            }, { quoted: message })
        }
    }
}

module.exports = { handler, bannedUsers }

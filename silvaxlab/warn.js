const config = require('../config')

const warnings = new Map()

const handler = {
    help: ['warn', 'resetwarn', 'warncount'],
    tags: ['group'],
    command: /^(warn|resetwarn|warncount)$/i,
    group: true,
    admin: true,
    botAdmin: true,
    owner: false,
    execute: async ({ jid, sock, message, args, text }) => {
        const command = text.split(' ')[0].toLowerCase()
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
            let targetJid = message.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0]
                || message.message?.extendedTextMessage?.contextInfo?.participant

            if (!targetJid) {
                return sock.sendMessage(jid, {
                    text: `⚠️ *Usage:*\n${config.PREFIX}${command} @user\n\nReply to or mention a user.`,
                    contextInfo
                }, { quoted: message })
            }

            if (!warnings.has(jid)) {
                warnings.set(jid, new Map())
            }
            const groupWarnings = warnings.get(jid)
            const targetNumber = targetJid.split('@')[0]

            switch (command) {
                case 'warn': {
                    const currentCount = (groupWarnings.get(targetJid) || 0) + 1
                    groupWarnings.set(targetJid, currentCount)

                    if (currentCount >= 3) {
                        await sock.sendMessage(jid, {
                            text: `⚠️ *WARNING ${currentCount}/3*\n\n@${targetNumber} has reached the maximum warnings and will be removed from the group.`,
                            mentions: [targetJid],
                            contextInfo
                        }, { quoted: message })

                        groupWarnings.delete(targetJid)
                        await sock.groupParticipantsUpdate(jid, [targetJid], 'remove')
                    } else {
                        await sock.sendMessage(jid, {
                            text: `⚠️ *WARNING ${currentCount}/3*\n\n@${targetNumber} has been warned.\n${3 - currentCount} warning(s) remaining before removal.`,
                            mentions: [targetJid],
                            contextInfo
                        }, { quoted: message })
                    }
                    break
                }

                case 'resetwarn': {
                    groupWarnings.delete(targetJid)
                    await sock.sendMessage(jid, {
                        text: `✅ Warnings reset for @${targetNumber}.`,
                        mentions: [targetJid],
                        contextInfo
                    }, { quoted: message })
                    break
                }

                case 'warncount': {
                    const count = groupWarnings.get(targetJid) || 0
                    await sock.sendMessage(jid, {
                        text: `📊 @${targetNumber} has *${count}/3* warning(s).`,
                        mentions: [targetJid],
                        contextInfo
                    }, { quoted: message })
                    break
                }
            }
        } catch (err) {
            await sock.sendMessage(jid, {
                text: `❌ Error: ${err.message}`,
                contextInfo
            }, { quoted: message })
        }
    }
}

module.exports = { handler }

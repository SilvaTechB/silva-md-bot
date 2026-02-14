const config = require('../config')

const disabledCommands = new Map()

const handler = {
    help: ['disable', 'enable', 'disabled'],
    tags: ['group', 'admin'],
    command: /^(disable|enable|disabled)$/i,
    group: true,
    admin: true,
    botAdmin: false,
    owner: false,

    execute: async ({ jid, sock, message, args, text }) => {
        const sender = message.key.participant || message.key.remoteJid
        const command = text.split(' ')[0].toLowerCase()

        try {
            if (!disabledCommands.has(jid)) {
                disabledCommands.set(jid, new Set())
            }

            const groupDisabled = disabledCommands.get(jid)

            switch (command) {
                case 'disable': {
                    const cmd = args[0]?.toLowerCase()
                    if (!cmd) {
                        return sock.sendMessage(jid, {
                            text: `╭━━━━━━━━━━━━━━━━━━━━╮\n┃   🔇 DISABLE CMD     ┃\n╰━━━━━━━━━━━━━━━━━━━━╯\n\n*Usage:*\n${config.PREFIX}disable <command>\n${config.PREFIX}enable <command>\n${config.PREFIX}disabled - List disabled commands\n\n*Example:*\n${config.PREFIX}disable sticker\n${config.PREFIX}disable tiktok\n\n_Disabled commands won't work in this group._`,
                            contextInfo: createContext(sender)
                        }, { quoted: message })
                    }

                    const protectedCmds = ['disable', 'enable', 'disabled', 'menu', 'help', 'owner']
                    if (protectedCmds.includes(cmd)) {
                        return sock.sendMessage(jid, {
                            text: `⚠️ Cannot disable *${cmd}* — it's a protected command.`,
                            contextInfo: createContext(sender)
                        }, { quoted: message })
                    }

                    groupDisabled.add(cmd)
                    await sock.sendMessage(jid, {
                        text: `🔇 Command *${cmd}* has been disabled in this group.`,
                        contextInfo: createContext(sender)
                    }, { quoted: message })
                    break
                }

                case 'enable': {
                    const cmd = args[0]?.toLowerCase()
                    if (!cmd) {
                        return sock.sendMessage(jid, {
                            text: `*Usage:* ${config.PREFIX}enable <command>`,
                            contextInfo: createContext(sender)
                        }, { quoted: message })
                    }

                    if (groupDisabled.has(cmd)) {
                        groupDisabled.delete(cmd)
                        await sock.sendMessage(jid, {
                            text: `🔊 Command *${cmd}* has been re-enabled.`,
                            contextInfo: createContext(sender)
                        }, { quoted: message })
                    } else {
                        await sock.sendMessage(jid, {
                            text: `⚠️ *${cmd}* is not disabled.`,
                            contextInfo: createContext(sender)
                        }, { quoted: message })
                    }
                    break
                }

                case 'disabled': {
                    if (groupDisabled.size === 0) {
                        return sock.sendMessage(jid, {
                            text: '✅ No commands are disabled in this group.',
                            contextInfo: createContext(sender)
                        }, { quoted: message })
                    }

                    const list = [...groupDisabled].map((cmd, i) => `${i + 1}. ${cmd}`).join('\n')
                    await sock.sendMessage(jid, {
                        text: `╭━━━━━━━━━━━━━━━━━━━━╮\n┃   🔇 DISABLED CMDS   ┃\n╰━━━━━━━━━━━━━━━━━━━━╯\n\n${list}\n\nUse ${config.PREFIX}enable <cmd> to re-enable.`,
                        contextInfo: createContext(sender)
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

function createContext(sender) {
    return {
        mentionedJid: [sender],
        forwardingScore: 999,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
            newsletterJid: '120363200367779016@newsletter',
            newsletterName: 'SILVA MD • COMMANDS',
            serverMessageId: Math.floor(Math.random() * 1000)
        }
    }
}

module.exports = { handler, disabledCommands }

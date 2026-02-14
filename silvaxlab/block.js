const config = require('../config')

const handler = {
    help: ['block', 'unblock', 'blocklist'],
    tags: ['owner'],
    command: /^(block|unblock|blocklist)$/i,
    group: false,
    admin: false,
    botAdmin: false,
    owner: true,

    execute: async ({ jid, sock, message, args, text }) => {
        const sender = message.key.participant || message.key.remoteJid
        const command = text.split(' ')[0].toLowerCase()

        try {
            switch (command) {
                case 'block': {
                    const mentions = message.message?.extendedTextMessage?.contextInfo?.mentionedJid || []
                    const quoted = message.message?.extendedTextMessage?.contextInfo?.participant
                    let targets = [...mentions]
                    if (quoted && !targets.includes(quoted)) targets.push(quoted)

                    if (targets.length === 0 && args[0]) {
                        const num = args[0].replace(/[^0-9]/g, '')
                        if (num) targets.push(num + '@s.whatsapp.net')
                    }

                    if (targets.length === 0) {
                        return sock.sendMessage(jid, {
                            text: `*Usage:*\n${config.PREFIX}block @user\n${config.PREFIX}block <number>\n${config.PREFIX}block (reply to message)`,
                            contextInfo: createContext(sender)
                        }, { quoted: message })
                    }

                    let blocked = 0
                    for (const target of targets) {
                        try {
                            await sock.updateBlockStatus(target, 'block')
                            blocked++
                        } catch (e) {}
                    }

                    await sock.sendMessage(jid, {
                        text: `🚫 Blocked ${blocked} user(s)`,
                        contextInfo: createContext(sender)
                    }, { quoted: message })
                    break
                }

                case 'unblock': {
                    const mentions = message.message?.extendedTextMessage?.contextInfo?.mentionedJid || []
                    const quoted = message.message?.extendedTextMessage?.contextInfo?.participant
                    let targets = [...mentions]
                    if (quoted && !targets.includes(quoted)) targets.push(quoted)

                    if (targets.length === 0 && args[0]) {
                        const num = args[0].replace(/[^0-9]/g, '')
                        if (num) targets.push(num + '@s.whatsapp.net')
                    }

                    if (targets.length === 0) {
                        return sock.sendMessage(jid, {
                            text: `*Usage:*\n${config.PREFIX}unblock @user\n${config.PREFIX}unblock <number>`,
                            contextInfo: createContext(sender)
                        }, { quoted: message })
                    }

                    let unblocked = 0
                    for (const target of targets) {
                        try {
                            await sock.updateBlockStatus(target, 'unblock')
                            unblocked++
                        } catch (e) {}
                    }

                    await sock.sendMessage(jid, {
                        text: `✅ Unblocked ${unblocked} user(s)`,
                        contextInfo: createContext(sender)
                    }, { quoted: message })
                    break
                }

                case 'blocklist': {
                    try {
                        const list = await sock.fetchBlocklist()
                        if (!list || list.length === 0) {
                            return sock.sendMessage(jid, {
                                text: '✅ No blocked contacts.',
                                contextInfo: createContext(sender)
                            }, { quoted: message })
                        }

                        let text = `╭━━━━━━━━━━━━━━━━━━━━╮\n┃   🚫 BLOCKED LIST    ┃\n╰━━━━━━━━━━━━━━━━━━━━╯\n\n`
                        list.forEach((jid, i) => {
                            text += `${i + 1}. @${jid.split('@')[0]}\n`
                        })
                        text += `\n*Total:* ${list.length} blocked`

                        await sock.sendMessage(jid, {
                            text,
                            mentions: list,
                            contextInfo: createContext(sender)
                        }, { quoted: message })
                    } catch (e) {
                        throw new Error('Failed to fetch block list')
                    }
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
            newsletterName: 'SILVA MD • BLOCK',
            serverMessageId: Math.floor(Math.random() * 1000)
        }
    }
}

module.exports = { handler }

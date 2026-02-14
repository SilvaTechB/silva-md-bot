const config = require('../config')

const protectedUsers = new Map()

let eventListenerRegistered = false

const handler = {
    help: ['antidemote', 'protect', 'unprotect', 'protected'],
    tags: ['group', 'admin'],
    command: /^(antidemote|protect|unprotect|protected)$/i,
    group: true,
    admin: true,
    botAdmin: true,
    owner: false,

    execute: async ({ jid, sock, message, args, text }) => {
        const sender = message.key.participant || message.key.remoteJid

        if (!eventListenerRegistered && sock) {
            registerEventListener(sock)
            eventListenerRegistered = true
        }

        const command = text.split(' ')[0].toLowerCase()

        try {
            if (!protectedUsers.has(jid)) {
                protectedUsers.set(jid, {
                    enabled: false,
                    users: []
                })
            }

            const groupProtection = protectedUsers.get(jid)

            switch (command) {
                case 'antidemote': {
                    const action = args[0]?.toLowerCase()

                    if (!action || !['on', 'off', 'enable', 'disable'].includes(action)) {
                        return sock.sendMessage(jid, {
                            text: `╭━━━━━━━━━━━━━━━━━━━━╮
┃   🛡️ ANTI-DEMOTE     ┃
╰━━━━━━���━━━━━━━━━━━━━╯

📊 *Status:* ${groupProtection.enabled ? '✅ ENABLED' : '❌ DISABLED'}
🛡️ *Protected Users:* ${groupProtection.users.length}

*Usage:*
${config.PREFIX}antidemote on - Enable protection
${config.PREFIX}antidemote off - Disable protection
${config.PREFIX}protect @user - Add user to protection
${config.PREFIX}unprotect @user - Remove protection
${config.PREFIX}protected - List protected users

_When enabled, demoted protected admins are auto-promoted back_`,
                            contextInfo: createContext(sender)
                        }, { quoted: message })
                    }

                    groupProtection.enabled = action === 'on' || action === 'enable'

                    await sock.sendMessage(jid, {
                        text: groupProtection.enabled
                            ? `✅ *Anti-Demote Protection ENABLED*\n\nProtected admins will be automatically re-promoted if demoted.`
                            : `❌ *Anti-Demote Protection DISABLED*`,
                        contextInfo: createContext(sender)
                    }, { quoted: message })
                    break
                }

                case 'protect': {
                    const mentions = message.message?.extendedTextMessage?.contextInfo?.mentionedJid || []

                    if (!mentions.length) {
                        return sock.sendMessage(jid, {
                            text: `*Usage:*\n${config.PREFIX}protect @user\n\nMention the user(s) you want to protect from demotion.`,
                            contextInfo: createContext(sender)
                        }, { quoted: message })
                    }

                    let added = 0
                    for (const mentionJid of mentions) {
                        const user = mentionJid.split('@')[0]
                        if (!groupProtection.users.includes(user)) {
                            groupProtection.users.push(user)
                            added++
                        }
                    }

                    await sock.sendMessage(jid, {
                        text: `🛡️ Added ${added} user(s) to anti-demote protection`,
                        mentions,
                        contextInfo: createContext(sender)
                    }, { quoted: message })
                    break
                }

                case 'unprotect': {
                    const mentions = message.message?.extendedTextMessage?.contextInfo?.mentionedJid || []

                    if (!mentions.length) {
                        return sock.sendMessage(jid, {
                            text: `*Usage:*\n${config.PREFIX}unprotect @user`,
                            contextInfo: createContext(sender)
                        }, { quoted: message })
                    }

                    let removed = 0
                    for (const mentionJid of mentions) {
                        const user = mentionJid.split('@')[0]
                        const index = groupProtection.users.indexOf(user)
                        if (index !== -1) {
                            groupProtection.users.splice(index, 1)
                            removed++
                        }
                    }

                    await sock.sendMessage(jid, {
                        text: `🔓 Removed ${removed} user(s) from protection`,
                        mentions,
                        contextInfo: createContext(sender)
                    }, { quoted: message })
                    break
                }

                case 'protected': {
                    if (!groupProtection.users.length) {
                        return sock.sendMessage(jid, {
                            text: `❌ No protected users in this group.\n\nUse ${config.PREFIX}protect @user to add.`,
                            contextInfo: createContext(sender)
                        }, { quoted: message })
                    }

                    const mentions = groupProtection.users.map(u => u + '@s.whatsapp.net')
                    const list = groupProtection.users
                        .map((u, i) => `${i + 1}. @${u}`)
                        .join('\n')

                    await sock.sendMessage(jid, {
                        text: `🛡️ *Protected Users (${groupProtection.users.length}):*\n\n${list}`,
                        mentions,
                        contextInfo: createContext(sender)
                    }, { quoted: message })
                    break
                }
            }

        } catch (err) {
            console.error('[ANTIDEMOTE] Error:', err)
            await sock.sendMessage(jid, {
                text: `❌ Error: ${err.message}`
            }, { quoted: message })
        }
    }
}

function registerEventListener(sock) {
    if (!sock?.ev) return
    sock.ev.on('group-participants.update', update =>
        handleGroupUpdate(update, sock)
    )
    console.log('[ANTIDEMOTE] Event listener registered')
}

async function handleGroupUpdate(update, sock) {
    const { id, participants, action, author } = update
    if (action !== 'demote') return

    const protection = protectedUsers.get(id)
    if (!protection?.enabled) return

    const botJid = sock.user?.id?.split(':')[0] + '@s.whatsapp.net'
    if (author === botJid) return

    for (const victim of participants) {
        const clean = victim.split('@')[0]
        if (!protection.users.includes(clean)) continue

        try {
            await new Promise(r => setTimeout(r, 2000))
            await sock.groupParticipantsUpdate(id, [victim], 'promote')

            await sock.sendMessage(id, {
                text: `🛡️ *ANTI-DEMOTE ACTIVATED*\n\n@${clean} is protected and has been re-promoted.\n@${author.split('@')[0]} attempted to demote a protected user.`,
                mentions: [victim, author]
            })
        } catch (err) {
            console.error('[ANTIDEMOTE] Protection failed:', err.message)
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
            newsletterName: 'SILVA MD • ANTIDEMOTE',
            serverMessageId: Math.floor(Math.random() * 1000)
        }
    }
}

module.exports = {
    handler,
    handleGroupUpdate,
    protectedUsers
}

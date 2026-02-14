const config = require('../config')

const antifakeGroups = new Map()

const handler = {
    help: ['antifake'],
    tags: ['group', 'admin'],
    command: /^(antifake)$/i,
    group: true,
    admin: true,
    botAdmin: true,
    owner: false,

    execute: async ({ jid, sock, message, args }) => {
        const sender = message.key.participant || message.key.remoteJid

        try {
            if (!antifakeGroups.has(jid)) {
                antifakeGroups.set(jid, {
                    enabled: false,
                    allowedPrefixes: []
                })
            }

            const settings = antifakeGroups.get(jid)
            const action = args[0]?.toLowerCase()

            if (!action || !['on', 'off', 'add', 'remove', 'list'].includes(action)) {
                return sock.sendMessage(jid, {
                    text: `╭━━━━━━━━━━━━━━━━━━━━╮\n┃   🔍 ANTI-FAKE       ┃\n╰━━━━━━━━━━━━━━━━━━━━╯\n\n📊 *Status:* ${settings.enabled ? '✅ ENABLED' : '❌ DISABLED'}\n📱 *Allowed Prefixes:* ${settings.allowedPrefixes.length > 0 ? settings.allowedPrefixes.join(', ') : 'All allowed'}\n\n*Usage:*\n${config.PREFIX}antifake on - Enable\n${config.PREFIX}antifake off - Disable\n${config.PREFIX}antifake add <prefix> - Allow country prefix (e.g., 254, 1)\n${config.PREFIX}antifake remove <prefix> - Remove prefix\n${config.PREFIX}antifake list - Show allowed prefixes\n\n_When enabled, only numbers with allowed country prefixes can join._`,
                    contextInfo: createContext(sender)
                }, { quoted: message })
            }

            switch (action) {
                case 'on':
                    settings.enabled = true
                    await sock.sendMessage(jid, {
                        text: settings.allowedPrefixes.length > 0
                            ? `✅ *Anti-Fake Enabled*\n\nOnly numbers starting with: ${settings.allowedPrefixes.join(', ')} can join.\nOthers will be automatically removed.`
                            : `✅ *Anti-Fake Enabled*\n\n⚠️ No prefixes set yet! Use ${config.PREFIX}antifake add <prefix> to whitelist country codes.`,
                        contextInfo: createContext(sender)
                    }, { quoted: message })
                    break

                case 'off':
                    settings.enabled = false
                    await sock.sendMessage(jid, {
                        text: '❌ *Anti-Fake Disabled*',
                        contextInfo: createContext(sender)
                    }, { quoted: message })
                    break

                case 'add': {
                    const prefix = args[1]?.replace(/[^0-9]/g, '')
                    if (!prefix) {
                        return sock.sendMessage(jid, {
                            text: `❌ Provide a country code prefix.\n\n*Example:* ${config.PREFIX}antifake add 254`,
                            contextInfo: createContext(sender)
                        }, { quoted: message })
                    }
                    if (!settings.allowedPrefixes.includes(prefix)) {
                        settings.allowedPrefixes.push(prefix)
                    }
                    await sock.sendMessage(jid, {
                        text: `✅ Added prefix: +${prefix}\n\n*Allowed:* ${settings.allowedPrefixes.map(p => '+' + p).join(', ')}`,
                        contextInfo: createContext(sender)
                    }, { quoted: message })
                    break
                }

                case 'remove': {
                    const prefix = args[1]?.replace(/[^0-9]/g, '')
                    if (!prefix) {
                        return sock.sendMessage(jid, {
                            text: `❌ Provide the prefix to remove.`,
                            contextInfo: createContext(sender)
                        }, { quoted: message })
                    }
                    const idx = settings.allowedPrefixes.indexOf(prefix)
                    if (idx !== -1) settings.allowedPrefixes.splice(idx, 1)
                    await sock.sendMessage(jid, {
                        text: `🗑️ Removed prefix: +${prefix}\n\n*Remaining:* ${settings.allowedPrefixes.length > 0 ? settings.allowedPrefixes.map(p => '+' + p).join(', ') : 'None'}`,
                        contextInfo: createContext(sender)
                    }, { quoted: message })
                    break
                }

                case 'list':
                    await sock.sendMessage(jid, {
                        text: settings.allowedPrefixes.length > 0
                            ? `📱 *Allowed Prefixes:*\n\n${settings.allowedPrefixes.map(p => '• +' + p).join('\n')}`
                            : '❌ No prefixes configured.',
                        contextInfo: createContext(sender)
                    }, { quoted: message })
                    break
            }

        } catch (err) {
            await sock.sendMessage(jid, {
                text: `❌ Error: ${err.message}`
            }, { quoted: message })
        }
    }
}

async function handleAntifake(update, sock) {
    const { id, participants, action } = update
    if (action !== 'add') return

    const settings = antifakeGroups.get(id)
    if (!settings?.enabled || settings.allowedPrefixes.length === 0) return

    const botJid = sock.user?.id?.split(':')[0] + '@s.whatsapp.net'

    for (const participant of participants) {
        if (participant === botJid) continue
        const num = participant.split('@')[0].replace(/[^0-9]/g, '')

        const isAllowed = settings.allowedPrefixes.some(prefix => num.startsWith(prefix))
        if (isAllowed) continue

        try {
            await new Promise(r => setTimeout(r, 1500))
            await sock.groupParticipantsUpdate(id, [participant], 'remove')
            await sock.sendMessage(id, {
                text: `🔍 *Anti-Fake:* @${num} was removed.\n\nOnly numbers with prefixes: ${settings.allowedPrefixes.map(p => '+' + p).join(', ')} are allowed.`,
                mentions: [participant]
            })
        } catch (e) {
            console.error('[ANTIFAKE] Remove failed:', e.message)
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
            newsletterName: 'SILVA MD • ANTIFAKE',
            serverMessageId: Math.floor(Math.random() * 1000)
        }
    }
}

module.exports = { handler, handleAntifake, antifakeGroups }

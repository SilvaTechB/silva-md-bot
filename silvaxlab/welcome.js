const config = require('../config')

const welcomeGroups = new Map()

const handler = {
    help: ['welcome', 'goodbye', 'setwelcome', 'setgoodbye'],
    tags: ['group', 'admin'],
    command: /^(welcome|goodbye|setwelcome|setgoodbye)$/i,
    group: true,
    admin: true,
    botAdmin: false,
    owner: false,

    execute: async ({ jid, sock, message, args, text }) => {
        try {
            const command = text.split(' ')[0].toLowerCase()
            const action = args[0]?.toLowerCase()

            if (!welcomeGroups.has(jid)) {
                welcomeGroups.set(jid, { welcome: true, goodbye: true, welcomeMsg: '', goodbyeMsg: '' })
            }

            const settings = welcomeGroups.get(jid)

            if (command === 'setwelcome') {
                const customMsg = args.join(' ')
                if (!customMsg) {
                    return sock.sendMessage(jid, {
                        text: `*Set Welcome Message*\n\nUsage: ${config.PREFIX}setwelcome Your message here\n\nVariables:\n- {user} = mentioned user\n- {group} = group name\n- {count} = member count\n\nExample:\n${config.PREFIX}setwelcome Welcome {user} to {group}! You are member #{count}`
                    }, { quoted: message })
                }
                settings.welcomeMsg = customMsg
                settings.welcome = true
                return sock.sendMessage(jid, {
                    text: `✅ Custom welcome message set!\n\nPreview:\n${customMsg.replace('{user}', '@you').replace('{group}', 'This Group').replace('{count}', '100')}`
                }, { quoted: message })
            }

            if (command === 'setgoodbye') {
                const customMsg = args.join(' ')
                if (!customMsg) {
                    return sock.sendMessage(jid, {
                        text: `*Set Goodbye Message*\n\nUsage: ${config.PREFIX}setgoodbye Your message here\n\nVariables:\n- {user} = mentioned user\n- {group} = group name`
                    }, { quoted: message })
                }
                settings.goodbyeMsg = customMsg
                settings.goodbye = true
                return sock.sendMessage(jid, {
                    text: `✅ Custom goodbye message set!\n\nPreview:\n${customMsg.replace('{user}', '@you').replace('{group}', 'This Group')}`
                }, { quoted: message })
            }

            if (!action || !['on', 'off'].includes(action)) {
                return sock.sendMessage(jid, {
                    text: `╭━━━━━━━━━━━━━━━━━━━━╮\n┃   ${command === 'welcome' ? '👋 WELCOME' : '👋 GOODBYE'}       ┃\n╰━━━━━━━━━━━━━━━━━━━━╯\n\n📊 *Welcome:* ${settings.welcome ? '✅ ON' : '❌ OFF'}\n📊 *Goodbye:* ${settings.goodbye ? '✅ ON' : '❌ OFF'}\n${settings.welcomeMsg ? '📝 Custom welcome: Set' : ''}\n${settings.goodbyeMsg ? '📝 Custom goodbye: Set' : ''}\n\n*Usage:*\n${config.PREFIX}welcome on/off\n${config.PREFIX}goodbye on/off\n${config.PREFIX}setwelcome <message>\n${config.PREFIX}setgoodbye <message>`
                }, { quoted: message })
            }

            settings[command] = action === 'on'

            await sock.sendMessage(jid, {
                text: `${action === 'on' ? '✅' : '❌'} *${command.charAt(0).toUpperCase() + command.slice(1)}* messages ${action === 'on' ? 'ENABLED' : 'DISABLED'}`
            }, { quoted: message })

        } catch (err) {
            await sock.sendMessage(jid, {
                text: `❌ Error: ${err.message}`
            }, { quoted: message })
        }
    }
}

module.exports = { handler, welcomeGroups }

const config = require('../config')

const spamMap = new Map()
const warnedUsers = new Map()
const SPAM_THRESHOLD = 8
const SPAM_WINDOW = 5000
const WARN_COOLDOWN = 30000

const antispamGroups = new Set()

const handler = {
    help: ['antispam on/off'],
    tags: ['group', 'admin', 'protection'],
    command: /^antispam$/i,
    group: true,
    admin: true,
    botAdmin: true,
    owner: false,

    execute: async ({ jid, sock, message, args }) => {
        try {
            const action = args[0]?.toLowerCase()

            if (!action || (action !== 'on' && action !== 'off')) {
                const isOn = antispamGroups.has(jid)
                return await sock.sendMessage(jid, {
                    text: `╭━━━━━━━━━━━━━━━━━━━━╮\n┃  🛡️ ANTI-SPAM      ┃\n╰━━━━━━━━━━━━━━━━━━━━╯\n\n*Status:* ${isOn ? '✅ ON' : '❌ OFF'}\n\n*Usage:*\n${config.PREFIX}antispam on\n${config.PREFIX}antispam off\n\n_Removes users who spam too many messages quickly._`
                }, { quoted: message })
            }

            if (action === 'on') {
                antispamGroups.add(jid)
                await sock.sendMessage(jid, { text: '🛡️ *Anti-Spam Enabled*\nUsers who spam will be warned and removed.' }, { quoted: message })
            } else {
                antispamGroups.delete(jid)
                await sock.sendMessage(jid, { text: '❌ *Anti-Spam Disabled*' }, { quoted: message })
            }
        } catch (err) {
            await sock.sendMessage(jid, { text: '❌ Error: ' + err.message }, { quoted: message })
        }
    }
}

function checkSpam(jid, sender) {
    if (!antispamGroups.has(jid)) return false
    const key = `${jid}_${sender}`
    const now = Date.now()
    const history = spamMap.get(key) || []
    const recent = history.filter(t => now - t < SPAM_WINDOW)
    recent.push(now)
    spamMap.set(key, recent)
    return recent.length >= SPAM_THRESHOLD
}

module.exports = { handler, antispamGroups, checkSpam }

const config = require('../config')
const os = require('os')

const handler = {
    help: ['menu', 'help'],
    tags: ['main'],
    command: /^(menu|help)$/i,
    group: false,
    admin: false,
    botAdmin: false,
    owner: false,

    execute: async ({ jid, sock, message }) => {
        try {
            const from = message.key.remoteJid
            const sender = message.key.participant || from
            const pushname = message.pushName || 'User'

            const uptime = formatUptime(process.uptime())
            const ram = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(1)
            const p = config.PREFIX

            const bannerImage = 'https://files.catbox.moe/riwqjf.png'

            const menuText = `╭━━━━━━━━━━━━━━━━━━━━╮
┃   ${config.BOT_NAME || 'SILVA MD'} v${config.VERSION || '3.0.0'}
╰━━━━━━━━━━━━━━━━━━━━╯

👋 *Hey ${pushname}!*

┏━━━ *BOT INFO* ━━━
┃ 📡 Mode: ${config.BOT_MODE || 'public'}
┃ ⏰ Uptime: ${uptime}
┃ 💾 RAM: ${ram}MB
┃ 🔌 Prefix: ${p}
┗━━━━━━━━━━━━━━━━━━

╭─『 📥 DOWNLOAD 』──⊷
│ ${p}play <song name>
│ ${p}song <title>
│ ${p}video <name>
│ ${p}tiktok <url>
│ ${p}fb <url>
│ ${p}ig <url>
│ ${p}capcut <url>
│ ${p}yts <search>
│ ${p}apk <app name>
│ ${p}spotify <query>
╰──────────────⊷

╭─『 🤖 AI 』──⊷
│ ${p}ai <prompt>
│ ${p}gpt <question>
│ ${p}ask <question>
╰──────────────⊷

╭─『 🛠️ UTILITY 』──⊷
│ ${p}sticker / ${p}s
│ ${p}take <pack> <author>
│ ${p}tts <lang> <text>
│ ${p}translate <lang> <text>
│ ${p}weather <city>
│ ${p}lyrics <song>
│ ${p}tourl (reply to media)
│ ${p}vv (view once)
│ ${p}delete / ${p}del
│ ${p}fancy <style> <text>
│ ${p}short <url>
│ ${p}whois @user
│ ${p}pp @user
│ ${p}movie <title>
│ ${p}element <name>
╰──────────────⊷

╭─『 🎮 FUN & GAMES 』──⊷
│ ${p}truth - Truth question
│ ${p}dare - Dare challenge
│ ${p}tod - Truth or Dare
│ ${p}joke - Random joke
│ ${p}8ball <question> - Magic 8-Ball
│ ${p}flip <heads/tails> - Coin flip
│ ${p}rps <rock/paper/scissors>
│ ${p}riddle - Brain teaser
│ ${p}ship @user1 @user2 - Love meter
│ ${p}inspire - Motivation quote
│ ${p}fact - Random fact
│ ${p}quote <category>
╰──────────────⊷

╭─『 👥 GROUP 』──⊷
│ ${p}kick @user
│ ${p}promote @user
│ ${p}demote @user
│ ${p}tagall <message>
│ ${p}everyone / ${p}hidetag
│ ${p}mute / ${p}unmute
│ ${p}ginfo - Group info
│ ${p}gdesc <text> - Set description
│ ${p}linkgroup - Group link
│ ${p}revoke - Reset group link
│ ${p}setpp - Set group pic
│ ${p}announce on/off
│ ${p}poll <question>|<opt1>|<opt2>
│ ${p}warn @user - Warn (3=kick)
│ ${p}admins - List all admins
│ ${p}welcome on/off
│ ${p}setwelcome <msg>
│ ${p}goodbye on/off
│ ${p}setgoodbye <msg>
│ ${p}clear
│ ${p}jid
╰──────────────⊷

╭─『 🛡️ PROTECTION 』──⊷
│ ${p}antidelete
│ ${p}anticall on/off
│ ${p}antilink on/off
│ ${p}antidemote on/off
│ ${p}antispam on/off
│ ${p}antibot on/off
│ ${p}checkban @user
╰──────────────⊷

╭─『 ⚙️ SYSTEM 』──⊷
│ ${p}alive
│ ${p}ping
│ ${p}start - Quick start guide
│ ${p}uptime
│ ${p}menu / ${p}help
│ ${p}owner
│ ${p}repo
╰──────────────⊷

╭─『 👑 OWNER 』──⊷
│ ${p}eval <code>
│ ${p}broadcast <msg>
│ ${p}ban @user
│ ${p}unban @user
│ ${p}banlist
│ ${p}bug @user <1-10>
│ ${p}settings
╰──────────────⊷

╭━━━━━━━━━━━━━━━━━━━━╮
┃ github.com/SilvaTechB
┃ Powered by ${config.BOT_NAME || 'Silva MD'}
╰━━━━━━━━━━━━━━━━━━━━╯`

            await sock.sendMessage(jid, {
                image: { url: bannerImage },
                caption: menuText,
                contextInfo: {
                    mentionedJid: [sender],
                    forwardingScore: 999,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: '120363200367779016@newsletter',
                        newsletterName: config.BOT_NAME || 'SILVA MD',
                        serverMessageId: Math.floor(Math.random() * 1000)
                    }
                }
            }, { quoted: message })

        } catch (err) {
            await sock.sendMessage(jid, {
                text: `❌ Error loading menu:\n${err.message}`
            }, { quoted: message })
        }
    }
}

function formatUptime(seconds) {
    const d = Math.floor(seconds / 86400)
    const h = Math.floor((seconds % 86400) / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = Math.floor(seconds % 60)

    const parts = []
    if (d > 0) parts.push(`${d}d`)
    if (h > 0) parts.push(`${h}h`)
    if (m > 0) parts.push(`${m}m`)
    parts.push(`${s}s`)
    return parts.join(' ')
}

module.exports = { handler }

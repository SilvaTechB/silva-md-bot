const config = require('../config')

const handler = {
    help: ['count', 'members', 'membercount'],
    tags: ['group'],
    command: /^(count|members|membercount)$/i,
    group: true,
    admin: false,
    botAdmin: false,
    owner: false,

    execute: async ({ jid, sock, message }) => {
        const sender = message.key.participant || message.key.remoteJid

        try {
            const metadata = await sock.groupMetadata(jid)
            const participants = metadata.participants

            const total = participants.length
            const superAdmins = participants.filter(p => p.admin === 'superadmin').length
            const admins = participants.filter(p => p.admin === 'admin').length
            const regular = total - superAdmins - admins

            const countryMap = {}
            for (const p of participants) {
                const num = p.id.split('@')[0].replace(/[^0-9]/g, '')
                let prefix = '??'
                if (num.startsWith('254')) prefix = '🇰🇪 KE'
                else if (num.startsWith('1')) prefix = '🇺🇸 US'
                else if (num.startsWith('44')) prefix = '🇬🇧 UK'
                else if (num.startsWith('91')) prefix = '🇮🇳 IN'
                else if (num.startsWith('234')) prefix = '🇳🇬 NG'
                else if (num.startsWith('255')) prefix = '🇹🇿 TZ'
                else if (num.startsWith('256')) prefix = '🇺🇬 UG'
                else if (num.startsWith('27')) prefix = '🇿🇦 ZA'
                else if (num.startsWith('233')) prefix = '🇬🇭 GH'
                else if (num.startsWith('237')) prefix = '🇨🇲 CM'
                else if (num.startsWith('250')) prefix = '🇷🇼 RW'
                else if (num.startsWith('62')) prefix = '🇮🇩 ID'
                else if (num.startsWith('55')) prefix = '🇧🇷 BR'
                else if (num.startsWith('92')) prefix = '🇵🇰 PK'
                else if (num.startsWith('880')) prefix = '🇧🇩 BD'
                else if (num.startsWith('251')) prefix = '🇪🇹 ET'
                else if (num.startsWith('243')) prefix = '🇨🇩 CD'
                else prefix = '🌍 +' + num.substring(0, 3)

                countryMap[prefix] = (countryMap[prefix] || 0) + 1
            }

            const sorted = Object.entries(countryMap)
                .sort((a, b) => b[1] - a[1])
                .map(([country, count]) => `  ${country}: ${count}`)
                .join('\n')

            await sock.sendMessage(jid, {
                text: `╭━━━━━━━━━━━━━━━━━━━━╮
┃   📊 MEMBER COUNT    ┃
╰━━━━━━━━━━━━━━━━━━━━╯

📛 *Group:* ${metadata.subject}

👥 *Total Members:* ${total}
👑 *Super Admins:* ${superAdmins}
🛡️ *Admins:* ${admins}
👤 *Regular:* ${regular}

🌍 *By Region:*
${sorted}

_${config.BOT_NAME || 'Silva MD'}_`,
                contextInfo: createContext(sender)
            }, { quoted: message })

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
            newsletterName: 'SILVA MD • COUNT',
            serverMessageId: Math.floor(Math.random() * 1000)
        }
    }
}

module.exports = { handler }

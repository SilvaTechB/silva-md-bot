const config = require('../config')

const handler = {
    help: ['whois @user', 'info @user'],
    tags: ['utility'],
    command: /^(whois|userinfo|whoami)$/i,
    group: false,
    admin: false,
    botAdmin: false,
    owner: false,

    execute: async ({ jid, sock, message, args }) => {
        try {
            const sender = message.key.participant || message.key.remoteJid
            const mentions = message.message?.extendedTextMessage?.contextInfo?.mentionedJid || []
            const quoted = message.message?.extendedTextMessage?.contextInfo?.participant
            const isGroup = jid.endsWith('@g.us')

            let targetJid = sender
            if (mentions.length > 0) {
                targetJid = mentions[0]
            } else if (quoted) {
                targetJid = quoted
            } else if (args[0]) {
                const num = args[0].replace(/[^0-9]/g, '')
                if (num.length >= 7) targetJid = num + '@s.whatsapp.net'
            }

            const targetNum = targetJid.split('@')[0]

            let ppUrl
            try {
                ppUrl = await sock.profilePictureUrl(targetJid, 'image')
            } catch (e) {
                ppUrl = null
            }

            let statusText = ''
            try {
                const st = await sock.fetchStatus(targetJid)
                if (st?.status) statusText = st.status
            } catch (e) {}

            let groupRole = ''
            if (isGroup) {
                try {
                    const metadata = await sock.groupMetadata(jid)
                    const member = metadata.participants.find(p => p.id === targetJid)
                    if (member) {
                        groupRole = member.admin === 'superadmin' ? 'Super Admin' : member.admin === 'admin' ? 'Admin' : 'Member'
                    }
                } catch (e) {}
            }

            const ownerNum = (Array.isArray(config.OWNER_NUMBER) ? config.OWNER_NUMBER[0] : config.OWNER_NUMBER || '').replace(/[^0-9]/g, '')
            const isOwner = targetNum === ownerNum
            const botNum = sock.user?.id?.split(':')[0]
            const isBot = targetNum === botNum

            let infoText = `╭━━━━━━━━━━━━━━━━━━━━╮
┃   👤 USER INFO      ┃
╰━━━━━━━━━━━━━━━━━━━━╯

📱 *Number:* +${targetNum}
🏷️ *Tag:* @${targetNum}
🔗 *Link:* wa.me/${targetNum}`

            if (statusText) infoText += `\n📝 *About:* ${statusText}`
            if (groupRole) infoText += `\n👑 *Group Role:* ${groupRole}`
            if (isOwner) infoText += `\n⭐ *Bot Owner:* Yes`
            if (isBot) infoText += `\n🤖 *This is the bot*`
            infoText += `\n🖼️ *Profile Pic:* ${ppUrl ? 'Available' : 'Hidden/None'}`

            const msgObj = {
                text: infoText,
                mentions: [targetJid],
                contextInfo: {
                    forwardingScore: 999,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: '120363200367779016@newsletter',
                        newsletterName: 'SILVA MD TOOLS 🔧',
                        serverMessageId: 145
                    }
                }
            }

            if (ppUrl) {
                await sock.sendMessage(jid, {
                    image: { url: ppUrl },
                    caption: infoText,
                    mentions: [targetJid]
                }, { quoted: message })
            } else {
                await sock.sendMessage(jid, msgObj, { quoted: message })
            }

        } catch (err) {
            await sock.sendMessage(jid, { text: '❌ Error: ' + err.message }, { quoted: message })
        }
    }
}

module.exports = { handler }

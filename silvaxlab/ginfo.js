const config = require('../config')

const handler = {
    help: ['ginfo', 'groupinfo'],
    tags: ['group'],
    command: /^(ginfo|groupinfo|gdata)$/i,
    group: true,
    admin: false,
    botAdmin: false,
    owner: false,

    execute: async ({ jid, sock, message }) => {
        try {
            const metadata = await sock.groupMetadata(jid)
            const admins = metadata.participants.filter(p => p.admin)
            const superAdmins = admins.filter(p => p.admin === 'superadmin')
            const regularAdmins = admins.filter(p => p.admin === 'admin')
            const members = metadata.participants.length

            let ppUrl
            try {
                ppUrl = await sock.profilePictureUrl(jid, 'image')
            } catch (e) { ppUrl = null }

            const created = metadata.creation ? new Date(metadata.creation * 1000).toLocaleDateString() : 'Unknown'

            let infoText = `╭━━━━━━━━━━━━━━━━━━━━╮
┃   📊 GROUP INFO     ┃
╰━━━━━━━━━━━━━━━━━━━━╯

📛 *Name:* ${metadata.subject}
🆔 *ID:* ${jid}
📝 *Description:*
${metadata.desc || 'No description'}

📅 *Created:* ${created}
👥 *Members:* ${members}
👑 *Admins:* ${admins.length}
🔒 *Locked:* ${metadata.restrict ? 'Yes' : 'No'}

👑 *Admin List:*`

            for (const admin of superAdmins) {
                infoText += `\n┃ 👑 @${admin.id.split('@')[0]} (Creator)`
            }
            for (const admin of regularAdmins) {
                infoText += `\n┃ ⭐ @${admin.id.split('@')[0]} (Admin)`
            }

            const mentionList = metadata.participants.map(p => p.id)

            if (ppUrl) {
                await sock.sendMessage(jid, {
                    image: { url: ppUrl },
                    caption: infoText,
                    mentions: mentionList
                }, { quoted: message })
            } else {
                await sock.sendMessage(jid, {
                    text: infoText,
                    mentions: mentionList
                }, { quoted: message })
            }

        } catch (err) {
            await sock.sendMessage(jid, { text: '❌ Error: ' + err.message }, { quoted: message })
        }
    }
}

module.exports = { handler }

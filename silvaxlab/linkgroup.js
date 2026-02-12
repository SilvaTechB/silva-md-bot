const config = require('../config')

const handler = {
    help: ['linkgroup', 'grouplink', 'invite'],
    tags: ['group'],
    command: /^(linkgroup|grouplink|invite|glink)$/i,
    group: true,
    admin: false,
    botAdmin: true,
    owner: false,

    execute: async ({ jid, sock, message }) => {
        try {
            const code = await sock.groupInviteCode(jid)
            const link = `https://chat.whatsapp.com/${code}`

            let metadata
            try {
                metadata = await sock.groupMetadata(jid)
            } catch (e) {
                metadata = { subject: 'Group' }
            }

            await sock.sendMessage(jid, {
                text: `╭━━━━━━━━━━━━━━━━━━━━╮
┃   🔗 GROUP LINK     ┃
╰━━━━━━━━━━━━━━━━━━━━╯

📛 *Group:* ${metadata.subject}
👥 *Members:* ${metadata.participants?.length || '?'}

🔗 *Invite Link:*
${link}`,
                contextInfo: {
                    forwardingScore: 999,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: '120363200367779016@newsletter',
                        newsletterName: 'SILVA MD GROUP 👥',
                        serverMessageId: 145
                    }
                }
            }, { quoted: message })

        } catch (err) {
            await sock.sendMessage(jid, { text: '❌ Error: ' + err.message }, { quoted: message })
        }
    }
}

module.exports = { handler }

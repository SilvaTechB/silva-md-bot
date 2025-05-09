const linkRegex = /chat.whatsapp.com\/(?:invite\/)?([0-9A-Za-z]{20,24})/i

export async function before(m, { conn, isAdmin, isBotAdmin }) {
  if (m.isBaileys && m.fromMe) return !0
  if (!m.isGroup) return !1

  // Skip if ANTILINK env is not true
  if (process.env.ANTILINK !== "true") return !0

  let chat = global.db.data.chats[m.chat]
  let bot = global.db.data.settings[this.user.jid] || {}
  const isGroupLink = linkRegex.exec(m.text)

  if (chat.antiLink && isGroupLink && !isAdmin) {
    if (isBotAdmin) {
      const linkThisGroup = `https://chat.whatsapp.com/${await this.groupInviteCode(m.chat)}`
      if (m.text.includes(linkThisGroup)) return !0
    }

    await conn.reply(
      m.chat,
      `*≡ Link Detected*

We do not allow links from other groups. 
I'm sorry *@${m.sender.split('@')[0]}*, you will be kicked out of the group ${isBotAdmin ? '' : '\n\nBut I’m not an admin, so I can’t remove you.'}`,
      null,
      { mentions: [m.sender] }
    )

    if (isBotAdmin && chat.antiLink) {
      await conn.sendMessage(m.chat, { delete: m.key })
      await conn.groupParticipantsUpdate(m.chat, [m.sender], 'remove')
    }
  }
  return !0
}

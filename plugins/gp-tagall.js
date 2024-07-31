let handler = async (m, { conn, text, participants, isAdmin, isOwner, groupMetadata }) => {
  let users = participants.map(u => u.id).filter(v => v !== conn.user.jid)
  m.reply(
    `▢ Group : *${groupMetadata.subject}*\n▢ Members : *${participants.length}*${text ? `\n▢ Message : ${text}\n` : ''}\n┌───⊷ *𝐒𝐈𝐋𝐕𝐀 𝐌𝐃 𝐁𝐎𝐓 MENTIONS*\n` +
      users.map(v => '▢ @' + v.replace(/@.+/, '')).join`\n` +
      '\n━━━━━━━━━━𝐒𝐈𝐋𝐕𝐀-𝐌𝐃━━━━━━━━━━━',
    null,
    {
      mentions: users,
    }
  )
}

handler.help = ['tagall']
handler.tags = ['group']
handler.command = ['tagall']
handler.admin = true
handler.group = true

export default handler

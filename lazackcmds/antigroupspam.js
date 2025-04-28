let spamData = {}

let handler = async (m, { conn, isBotAdmin }) => {
  if (!m.isGroup) return
  if (m.isBaileys) return

  let id = m.chat
  let user = m.sender
  let now = Date.now()

  spamData[id] = spamData[id] || {}
  spamData[id][user] = spamData[id][user] || { count: 0, lastTime: 0 }

  if (now - spamData[id][user].lastTime > 7000) {
    spamData[id][user].count = 0
  }

  spamData[id][user].count++
  spamData[id][user].lastTime = now

  if (spamData[id][user].count >= 5) {
    spamData[id][user].count = 0

    // Simple alert, not big media sending inside .all
    await conn.reply(m.chat, `🚨 *SPAM ALERT!*\n@${user.split('@')[0]} is spamming!`, m, {
      mentions: [user]
    })

    if (isBotAdmin) {
      try {
        await conn.groupParticipantsUpdate(m.chat, [user], 'restrict') // Mute the spammer
      } catch (e) {
        console.log('Failed to restrict spammer:', e)
      }
    }
  }
}

handler.all = handler
export default handler

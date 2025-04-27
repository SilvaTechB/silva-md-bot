let spamData = {}

let handler = async (m, { conn }) => {
  if (!m.isGroup) return // Only act in groups
  if (m.isBaileys) return // Ignore bot system messages
  
  let id = m.chat
  let user = m.sender

  spamData[id] = spamData[id] || {}
  spamData[id][user] = spamData[id][user] || { count: 0, lastTime: 0 }

  let now = Date.now()

  // If the last message was sent more than 7 seconds ago, reset the counter
  if (now - spamData[id][user].lastTime > 7000) {
    spamData[id][user].count = 0
  }

  spamData[id][user].count++
  spamData[id][user].lastTime = now

  // If user sends 5 messages in less than 7 seconds
  if (spamData[id][user].count >= 5) {
    await conn.sendMessage(m.chat, {
      text: `🚨 *Anti-Spam Alert!*\n@${user.split('@')[0]} is spamming the group! Please slow down.`,
      mentions: [user],
      contextInfo: {
        forwardingScore: 999,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
          newsletterJid: '120363200367779016@newsletter',
          newsletterName: '◢◤ Silva MD Bot ◢◤',
          serverMessageId: 143
        }
      }
    })

    spamData[id][user].count = 0 // Reset counter after warning
  }
}

export default handler

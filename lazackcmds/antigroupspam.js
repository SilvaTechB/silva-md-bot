let spamData = {}

let handler = {}
handler.all = async (m, { conn }) => {
  if (!m.isGroup) return // Only in groups
  if (m.isBaileys) return // Ignore bot system messages
  
  let id = m.chat
  let user = m.sender

  spamData[id] = spamData[id] || {}
  spamData[id][user] = spamData[id][user] || { count: 0, lastTime: 0 }

  let now = Date.now()

  // Reset counter if last message was long ago
  if (now - spamData[id][user].lastTime > 7000) {
    spamData[id][user].count = 0
  }

  spamData[id][user].count++
  spamData[id][user].lastTime = now

  // Trigger when user sends 5+ fast messages
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

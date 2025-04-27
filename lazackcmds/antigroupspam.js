let spamData = {}

let handler = {}
handler.all = async (m, { conn }) => {
  try {
    if (!m.isGroup) return
    if (m.isBaileys) return

    let id = m.chat
    let user = m.sender

    spamData[id] = spamData[id] || {}
    spamData[id][user] = spamData[id][user] || { count: 0, lastTime: 0 }

    let now = Date.now()

    if (now - spamData[id][user].lastTime > 7000) {
      spamData[id][user].count = 0
    }

    spamData[id][user].count++
    spamData[id][user].lastTime = now

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

      spamData[id][user].count = 0 // Reset after warning
    }
  } catch (e) {
    console.error(e) // <== just log the error
  }
}

export default handler

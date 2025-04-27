let spamData = {}

let handler = async (m, { conn }) => {
  if (!m.isGroup) return // Only act in groups
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

  if (spamData[id][user].count >= 5) {
    // 🚨 Send animated sticker alert first
    await conn.sendMessage(m.chat, {
      sticker: { url: "https://bg3.wiki/wiki/File:Sticker_Emoji_Gale_Plead.webp" }, // Cool alert sticker
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

    // 🚨 Then send the anti-spam alert text
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

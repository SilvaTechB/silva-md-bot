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
      spamData[id][user].count = 0

      await conn.sendMessage(m.chat, {
        text: `🚨 *Anti-Spam Alert!*\n\n@${user.split('@')[0]} please slow down! You are spamming.`,
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

      // Optionally send a cool animated sticker alert
      await conn.sendMessage(m.chat, { 
        sticker: { url: "https://i.ibb.co/3rQhv6d/alert-sticker.webp" } // animated sticker url
      }, { quoted: m })
    }
  } catch (e) {
    console.error('AntiSpam Error:', e)
  }
}

export default handler

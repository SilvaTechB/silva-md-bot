let spamData = {}

let handler = async (m, { conn, participants }) => {
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
      text: `🚨 *Anti-Spam Alert!*\n@${user.split('@')[0]} is detected spamming and will be muted.`,
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

    // Mute user (if bot is admin)
    await conn.groupParticipantsUpdate(m.chat, [user], 'restrict') // Mute

    await conn.sendMessage(m.chat, { 
      sticker: { url: "https://raw.githubusercontent.com/SilvaTechB/silva-md-bot/refs/heads/main/media/STK-20250425-WA0008.webp" }
    }, { quoted: m })
  }
}

handler.all = handler

export default handler

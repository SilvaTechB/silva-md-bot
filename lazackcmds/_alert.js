let handler = m => m
let connectionAlertSent = false

import moment from 'moment-timezone'

handler.before = async function (m) {
  if (connectionAlertSent) return

  const setting = global.db.data.settings[this.user.jid] || {}
  const alertJid = '254743706010@s.whatsapp.net' // 👑 Your number
  const currentTime = moment.tz('Africa/Nairobi').format('dddd, MMMM Do YYYY - h:mm A')

  const botInfo = {
    name: this.user.name || 'SilvaBot',
    jid: this.user.jid,
    prefix: setting.prefix || '.',
    mode: setting.self ? 'PRIVATE 🔒' : 'PUBLIC 🌍',
  }

  // 🎨 Stylish Message
  const message = `
🎉 *SILVA MD IS ONLINE!*

🕘 *Time:* ${currentTime}
👤 *Bot Name:* ${botInfo.name}
🆔 *JID:* ${botInfo.jid}
🌐 *Mode:* ${botInfo.mode}
💡 *Prefix:* ${botInfo.prefix}

✅ _Silva MD Bot connected successfully!_
`.trim()

  // 🎧 Send Audio Greeting (PTT)
  const audioUrl = 'https://github.com/SilvaTechB/silva-md-bot/raw/main/media/money.mp3' // Your audio URL
  await this.sendMessage(alertJid, {
    audio: { url: audioUrl },
    mimetype: 'audio/mpeg',
    ptt: true,
  })

  // 📰 Fancy Connection Announcement
  await this.sendMessage(alertJid, {
    text: message,
    contextInfo: {
      mentionedJid: [alertJid],
      forwardingScore: 999,
      isForwarded: true,
      forwardedNewsletterMessageInfo: {
        newsletterJid: '120363200367779016@newsletter',
        newsletterName: 'SILVA CONNECTION ⚙️🚀',
        serverMessageId: 143,
      },
    },
  })

  // 📝 Update Bot Bio
  await this.updateProfileStatus(`🤖 Silva MD Bot | Connected: ${currentTime}`).catch(console.error)

  // 🔋 Send Uptime Report
  const uptime = process.uptime()
  const formatUptime = (seconds) => {
    let h = Math.floor(seconds / 3600)
    let m = Math.floor((seconds % 3600) / 60)
    let s = Math.floor(seconds % 60)
    return `${h}h ${m}m ${s}s`
  }

  await this.sendMessage(alertJid, {
    text: `🔋◢◤ Silva Md Bot ◢◤ *Uptime:* ${formatUptime(uptime)}\n📡 *Running smoothly...◢◤ Silva Tech Inc ◢◤*`,
  })

  connectionAlertSent = true
}

export default handler

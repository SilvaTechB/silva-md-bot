let handler = m => m
import moment from 'moment-timezone'

let connectionNotified = false
let lock = false // 🛑 Lock to prevent race condition

handler.before = async function (m) {
  if (connectionNotified || lock) return // 🚫 If already done or in progress, exit

  lock = true // 🧷 Lock it right away to prevent overlaps

  try {
    const setting = global.db.data.settings[this.user.jid] || {}
    const alertJid = '254743706010@s.whatsapp.net'
    const currentTime = moment.tz('Africa/Nairobi').format('dddd, MMMM Do YYYY - h:mm A')

    const botInfo = {
      name: this.user.name || 'SilvaBot',
      jid: this.user.jid,
      prefix: setting.prefix || '.',
      mode: setting.self ? 'PRIVATE 🔒' : 'PUBLIC 🌍',
    }

    const message = `
🎉 *SILVA MD IS ONLINE!*

🕘 *Time:* ${currentTime}
👤 *Bot Name:* ${botInfo.name}
🆔 *JID:* ${botInfo.jid}
🌐 *Mode:* ${botInfo.mode}
💡 *Prefix:* ${botInfo.prefix}

✅ _Silva MD Bot connected successfully!_
`.trim()

    // 🎧 Send audio welcome
    const audioUrl = 'https://github.com/SilvaTechB/silva-md-bot/raw/main/media/money.mp3'
    await this.sendMessage(alertJid, {
      audio: { url: audioUrl },
      mimetype: 'audio/mpeg',
      ptt: true,
    }).catch(console.error)

    // 📩 Send main message
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
    }).catch(console.error)

    // 📝 Update status
    await this.updateProfileStatus(`🤖 Silva MD Bot | Connected: ${currentTime}`).catch(console.error)

    // ⏱️ Uptime report
    const uptime = process.uptime()
    const formatUptime = (sec) => {
      const h = Math.floor(sec / 3600)
      const m = Math.floor((sec % 3600) / 60)
      const s = Math.floor(sec % 60)
      return `${h}h ${m}m ${s}s`
    }

    await this.sendMessage(alertJid, {
      text: `🔋◢◤ Silva Md Bot ◢◤\n*Uptime:* ${formatUptime(uptime)}\n📡 *Running smoothly...*\n✨ Silva Tech Inc.`,
    }).catch(console.error)

    connectionNotified = true // ✅ Done!
  } catch (err) {
    console.error('Startup alert error:', err)
  } finally {
    lock = false // 🔓 Release lock just in case
  }
}

export default handler

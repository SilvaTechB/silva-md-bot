let handler = m => m
let connectionAlertSent = false // Flag to track if alert was sent

// Run immediately when bot connects
handler.before = async function (m) {
  if (connectionAlertSent) return // Exit if already sent
  let setting = global.db.data.settings[this.user.jid]
  const alertJid = '254743706010@s.whatsapp.net'
  
  // Get bot information
  const botInfo = {
    username: this.user.name || 'SilvaBot',
    contact: this.user.jid,
    prefix: setting.prefix || '',
    mode: setting.self ? 'PRIVATE' : 'PUBLIC'
  }

  // Create connection message
  const connectionAlert = 
    `✅ *CONNECTION ESTABLISHED*\n\n` +
    `👤 Username: ${botInfo.username}\n` +
    `📱 Contact: ${botInfo.contact}\n` +
    `⚡ Prefix: ${botInfo.prefix}\n` +
    `🌐 Mode: ${botInfo.mode} MODE\n\n` +
    `_Bot successfully connected to WhatsApp servers_`

  // Send alert message
  await this.sendMessage(alertJid, { 
    text: connectionAlert 
  }).catch(console.error)
  
  connectionAlertSent = true // Mark as sent
}

export default handler

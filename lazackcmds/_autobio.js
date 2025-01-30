let handler = m => m

// Run immediately when bot connects
handler.before = async function (m) {
  let setting = global.db.data.settings[this.user.jid]
  const startTime = Date.now() // Capture bot start timestamp

  const updateBio = async () => {
    // Get Nairobi time components
    const nairobiTime = new Date().toLocaleTimeString('en-KE', {
      timeZone: 'Africa/Nairobi',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
    
    const nairobiDate = new Date().toLocaleDateString('en-KE', {
      timeZone: 'Africa/Nairobi',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
    
    const nairobiDay = new Date().toLocaleDateString('en-KE', {
      timeZone: 'Africa/Nairobi',
      weekday: 'long'
    })

    // Calculate uptime from start timestamp
    const uptime = Date.now() - startTime
    const muptime = clockString(uptime)

    // Build bio string
    let bio = `⏳ ${nairobiTime} | 📅 ${nairobiDay}, ${nairobiDate}\n`
    bio += `🆙 Active: ${muptime}\n`
    bio += `┃ 💻 Powered by SilvaBot`

    await this.updateProfileStatus(bio).catch(console.error)
  }

  // Initial update on connect
  await updateBio()
  
  // Update every 60 seconds (optional)
  setInterval(updateBio, 60000)
}

export default handler

function clockString(ms) {
  const d = Math.floor(ms / 86400000)
  const h = Math.floor(ms / 3600000) % 24
  const m = Math.floor(ms / 60000) % 60
  return `${d}d ${h}h ${m}m`
}

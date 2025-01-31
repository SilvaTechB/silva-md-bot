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
      second: '2-digit', // Include seconds
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
    let bio = `🇰🇪⏳ ${nairobiTime} | 📅 ${nairobiDay}, ${nairobiDate}\n`
    bio += `🆙 Active: ${muptime}\n`
    bio += `┃ 💻 Powered by SilvaBot`

    await this.updateProfileStatus(bio).catch(console.error)
  }

  // Initial update on connect
  await updateBio()
  
  // Update every 5 seconds
  setInterval(updateBio, 5000)
}

export default handler

function clockString(ms) {
  const d = Math.floor(ms / 86400000)
  const h = Math.floor(ms / 3600000) % 24
  const m = Math.floor(ms / 60000) % 60
  const s = Math.floor(ms / 1000) % 60 // Include seconds
  return `${d}d ${h}h ${m}m ${s}s`
}

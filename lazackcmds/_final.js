let handler = m => m

// Run immediately when bot connect
handler.before = async function (m) {
  let setting = global.db.data.settings[this.user.jid]
  
  // Function to get Nairobi date components
  const getNairobiDate = () => {
    const options = {
      timeZone: 'Africa/Nairobi',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric'
    }
    const formatter = new Intl.DateTimeFormat('en-US', options)
    const parts = formatter.formatToParts(new Date())
    return {
      year: parseInt(parts.find(p => p.type === 'year').value),
      month: parseInt(parts.find(p => p.type === 'month').value),
      day: parseInt(parts.find(p => p.type === 'day').value)
    }
  }

  const checkBirthday = async () => {
    const { year, month, day } = getNairobiDate()
    
    // Check if it's February 11th in Nairobi time
    if (month === 2 && day === 11) { // February is month 2
      if (!setting.lastBirthdayYear || setting.lastBirthdayYear !== year) {
        const jid = '254743706010@s.whatsapp.net'
        await this.sendMessage(jid, { 
          text: '🎉🎂 Happy Birthday! Wishing you an amazing day filled with joy and laughter! 🎈🎁\n\n happy birthday silva tech inc have a day filled with love\n\n you are one of the best a universal developer and helper'
        }).catch(console.error)
        setting.lastBirthdayYear = year
      }
    }
  }

  // Initial check on connect
  await checkBirthday()
  
  // Check every hour (3600000 ms)
  setInterval(checkBirthday, 3600000)
}

export default handler

import fetch from 'node-fetch'

let handler = async (m, { text, conn, usedPrefix, command }) => {
  if (!text && !(m.quoted && m.quoted.text)) {
    throw `Please provide some text or quote a message to get a response.`
  }

  if (!text && m.quoted && m.quoted.text) {
    text = m.quoted.text
  }

  try {
    // Start the loading process
    m.react('⏳') // React with a loading symbol
    conn.sendPresenceUpdate('composing', m.chat)
    
    const prompt = encodeURIComponent(text)
    
    // Start a progress simulation for loading
    let loadingMessage = await conn.sendMessage(m.chat, 'Loading... 0%', { quoted: m })
    
    let progress = 0
    let loadingInterval = setInterval(() => {
      progress += 10
      if (progress <= 100) {
        conn.sendMessage(m.chat, `Loading... ${progress}%`, { quoted: loadingMessage })
      } else {
        clearInterval(loadingInterval)
      }
    }, 1000)

    // API call 1: GuruSensei
    const guru1 = `https://api.gurusensei.workers.dev/llama?prompt=${prompt}`

    try {
      let response = await fetch(guru1)
      let data = await response.json()
      let result = data.response.response

      if (!result) {
        throw new Error('No valid JSON response from the first API')
      }

      // Add watermark to result
      let watermarkedResult = `${result}\n\n*Powered by Silva MD Bot*`

      // Send result with watermark
      await conn.sendMessage(m.chat, watermarkedResult, { quoted: m })
      m.react('✅') // React with a checkmark when done
    } catch (error) {
      console.error('Error from the first API:', error)
      
      // API call 2: GuruAPI (fallback)
      const guru2 = `https://ultimetron.guruapi.tech/gpt3?prompt=${prompt}`

      let response = await fetch(guru2)
      let data = await response.json()
      let result = data.completion

      // Add watermark to result
      let watermarkedResult = `${result}\n\n*Powered by Silva MD Bot*`

      // Send result with watermark
      await conn.sendMessage(m.chat, watermarkedResult, { quoted: m })
      m.react('✅') // React with a checkmark when done
    }

  } catch (error) {
    console.error('Error:', error)
    throw `*ERROR*`
  }
}

handler.help = ['chatgpt']
handler.tags = ['AI']
handler.command = ['bro', 'chatgpt', 'ai', 'gpt']

export default handler

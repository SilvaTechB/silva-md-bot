import { promises } from 'fs'
import { join } from 'path'
import axios from 'axios'

let handler = async function (m, { conn, __dirname }) {
  const githubRepoURL = 'https://github.com/SilvaTechB/silva-md-bot'

  try {
    const [, username, repoName] = githubRepoURL.match(/github\.com\/([^/]+)\/([^/]+)/)

    const response = await axios.get(`https://api.github.com/repos/${username}/${repoName}`)

    if (response.status === 200) {
      const repoData = response.data

      // Format the repository information with emojis
      const formattedInfo = `
      🍑🍆𝐒𝐈𝐋𝐕𝐀 𝐌𝐃 𝐁𝐎𝐓💦☣
SILVA WANTS MONEY FROM YOU

MAKE YOUR PAYMENT EXCLUSIVELY FOR SILVA MD BOT PROJECT

\`\`\`𝐒𝐈𝐋𝐕𝐀 𝐌𝐃 𝐁𝐎𝐓 PAYMENT\`\`\`
`.trim()

      // Send the formatted information as a message
      await conn.relayMessage(
        m.chat,
        {
          requestPaymentMessage: {
            currencyCodeIso4217: 'KSH',
            amount1000: 2500,
            requestFrom: m.sender,
            noteMessage: {
              extendedTextMessage: {
                text: formattedInfo,
                contextInfo: {
                  externalAdReply: {
                    showAdAttribution: true,
                  },
                },
              },
            },
          },
        },
        {}
      )
    } else {
      // Handle the case where the API request fails
      await conn.reply(m.chat, 'Unable to fetch repository information.', m)
    }
  } catch (error) {
    console.error(error)
    await conn.reply(m.chat, 'An error occurred while fetching repository information.', m)
  }
}

handler.help = ['script']
handler.tags = ['main']
handler.command = ['pay', 'money', 'lipa']

export default handler

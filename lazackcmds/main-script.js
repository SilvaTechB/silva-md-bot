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
📂 Repository Name: ${repoData.name}
📝 Description: ${repoData.description}
👤 Owner: ${repoData.owner.login}
⭐ Stars: ${repoData.stargazers_count}
🍴 Forks: ${repoData.forks_count}
🌐 URL: ${repoData.html_url}
      \`🚀 OUR REPOSITORY\`
*Welcome to Silva MD! 🤖✨*

_Get Started: Welcome to the Silva MD WhatsApp bot repository! 🎉 Feel free to fork this project and customize it for your own WhatsApp experience._

*How to Use:*

1. *Fork the Repository:* Click on the “Fork” button to create your own copy.
2. *Set Up Your Bot:* Follow the setup instructions in the README file.
3. *Enjoy Your Bot:* Start chatting with Silva MD and explore its features! 💬

Thank you for joining our community! If you have any questions, don’t hesitate to reach out. Happy coding! 🚀
> Trying to make it a user friendly bot

*_DEPLOY 𝐒𝐈𝐋𝐕𝐀 𝐌𝐃 𝐁𝐎𝐓 NOW_*

\`\`\`USER FRIENDLY 𝐒𝐈𝐋𝐕𝐀 𝐌𝐃 𝐁𝐎𝐓💥\`\`\`
`.trim()

      // Send the formatted information as a message
      await conn.relayMessage(
        m.chat,
        {
          requestPaymentMessage: {
            currencyCodeIso4217: 'INR',
            amount1000: 690000000000,
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
handler.command = ['sc', 'repo', 'script']

export default handler

import { generateWAMessageFromContent, proto } from '@whiskeysockets/baileys'

let handler = async (m, { conn, usedPrefix, text }) => {
  if (!text) {
    // Main Menu - Category Selection
    const sections = [{
      title: '『 Silva MD Categories 』',
      rows: [
        { title: '🔍 SEARCH', rowId: `${usedPrefix}menu search` },
        { title: '📥 DOWNLOAD', rowId: `${usedPrefix}menu download` },
        { title: '🛠️ TOOLS', rowId: `${usedPrefix}menu tools` },
        { title: '🎉 FUN', rowId: `${usedPrefix}menu fun` },
        { title: '⚙️ OTHER', rowId: `${usedPrefix}menu other` }
      ]
    }]

    const listMessage = {
      text: '🌟 *SILVA MD BOT MAIN MENU*',
      footer: '➤ Select category to view commands\n➤ Powered by Lazack',
      title: 'SILVA MD BOT',
      buttonText: 'VIEW CATEGORIES',
      sections
    }

    await conn.sendMessage(m.chat, listMessage, { quoted: m })
  } else {
    // Submenu - Command List
    const category = text.toLowerCase()
    const commands = {
      search: [
        { cmd: 'yts', example: 'elaina edit', desc: 'Search YouTube videos' },
        { cmd: 'google', example: 'anime', desc: 'Web search' }
      ],
      download: [
        { cmd: 'ytmp3', example: 'https://youtu.be/...', desc: 'YouTube audio download' },
        { cmd: 'ytmp4', example: 'https://youtu.be/...', desc: 'YouTube video download' }
      ],
      tools: [
        { cmd: 'sticker', example: '(reply media)', desc: 'Create sticker' },
        { cmd: 'ocr', example: '(reply image)', desc: 'Extract text from image' }
      ],
      fun: [
        { cmd: 'quote', example: '', desc: 'Random anime quote' },
        { cmd: 'character', example: 'elaina', desc: 'Anime character info' }
      ],
      other: [
        { cmd: 'ping', example: '', desc: 'Bot response check' },
        { cmd: 'owner', example: '', desc: 'Contact bot owner' }
      ]
    }

    if (!commands[category]) return m.reply('Invalid category!')
    
    let push = []
    for (let { cmd, example, desc } of commands[category]) {
      push.push({
        body: proto.Message.InteractiveMessage.Body.fromObject({
          text: `*${usedPrefix + cmd}*\n${desc}\n◦ Example: ${usedPrefix + cmd} ${example}`
        }),
        footer: proto.Message.InteractiveMessage.Footer.fromObject({
          text: 'SILVA MD BOT'
        }),
        header: proto.Message.InteractiveMessage.Header.fromObject({
          hasMediaAttachment: false
        }),
        nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.fromObject({
          buttons: [{
            "name": "cta_copy",
            "buttonParamsJson": JSON.stringify({
              "display_text": "📋 Copy Example",
              "copy_code": `${usedPrefix + cmd} ${example}`
            })
          }]
        })
      })
    }

    const bot = generateWAMessageFromContent(m.chat, {
      viewOnceMessage: {
        message: {
          interactiveMessage: proto.Message.InteractiveMessage.fromObject({
            body: { text: `📁 *${category.toUpperCase()} COMMANDS*` },
            footer: { text: '➤ Swipe to view all commands\n➤ Tap button to copy example' },
            header: { hasMediaAttachment: false },
            carouselMessage: {
              cards: push
            }
          })
        }
      }
    }, { quoted: m })

    await conn.relayMessage(m.chat, bot.message, { messageId: bot.key.id })
  }
  await m.react('✅')
}

handler.help = ["menu", "menu <category>"]
handler.tags = ["tools"]
handler.command = ["king", "queen"]
export default handler

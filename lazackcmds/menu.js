import os from 'os'
import fs from 'fs'
import path from 'path'
import moment from 'moment-timezone'
import { promisify } from 'util'

const readdir = promisify(fs.readdir)

let handler = async (m, { conn }) => {
  try {
    const menuThumbnail = 'https://i.imgur.com/GomcuUg.jpeg'
    const audioUrl = 'https://github.com/SilvaTechB/silva-md-bot/raw/main/media/Menu.mp3'
    const lazackPath = './lazackcmds'

    let commands = []
    try {
      commands = await readdir(lazackPath)
    } catch (e) {
      commands = ['botmenu', 'ownermenu', 'groupmenu'] // fallback
    }

    const commandList = commands
      .map((cmd, idx) => `┠─ ◦ ${idx + 1}. ${path.parse(cmd).name}`)
      .join('\n')

    const sysInfo = {
      totalRAM: `${(os.totalmem() / (1024 ** 3)).toFixed(2)} GB`,
      usedRAM: `${((os.totalmem() - os.freemem()) / (1024 ** 3)).toFixed(2)} GB`,
      uptime: moment.duration(os.uptime(), 'seconds').humanize(),
      timestamp: moment.tz('Africa/Nairobi').format('ddd DD/MM/YY HH:mm:ss'),
      platform: `${os.platform()} ${os.arch()}`,
      version: '2.1.2',
      developer: '@SilvaTechB'
    }

    const menuTemplates = {
      cyberpunk: ({ user, commands, ...info }) => `╭──「 SILVA MD ⁣𓄹▸ᴮᴼᵀ 」
│ ◦ ʜᴇʏ ${user}
│ ◦ ${info.timestamp}
╰┬─────────────
╭┴─────────────
│ ˹⚡˼ ʀᴀᴍ: ${info.usedRAM}/${info.totalRAM}
│ ˹🕒˼ ᴜᴘᴛɪᴍᴇ: ${info.uptime}
│ ˹💻˼ ᴏs: ${info.platform}
╰┬─────────────
╭┴──「 ᴄᴏᴍᴍᴀɴᴅs 」
🤖 botmenu
👑 ownermenu
🧑‍🤝‍🧑 groupmenu
📥 dlmenu
🎉 funmenu
💰 economymenu
🎮 gamemenu
🎨 stickermenu
🧰 toolmenu
🎩 logomenu
🌙 nsfwmenu
🙈 list
🌚 menu2
🧠 gpt
╰──────────────────
🔗 github.com/SilvaTechB`.trim(),

      // (Other themes omitted for brevity – no change needed if they're working fine)
    }

    const themes = Object.keys(menuTemplates)
    const selectedTheme = themes[Math.floor(Math.random() * themes.length)]

    const status = menuTemplates[selectedTheme]({
      user: m.pushName || 'User',
      commands: commandList,
      ...sysInfo
    })

    // Send image first, wait a bit to avoid rate limit
    await conn.sendMessage(m.chat, {
      image: { url: menuThumbnail },
      caption: status,
      contextInfo: {
        mentionedJid: [m.sender],
        forwardingScore: 999,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
          newsletterJid: '120363200367779016@newsletter',
          newsletterName: 'SILVA MD BOT 💖',
          serverMessageId: 143
        }
      }
    }, { quoted: m })

    // Small delay between messages to avoid rate-limiting
    await new Promise(resolve => setTimeout(resolve, 1500))

    await conn.sendMessage(m.chat, {
      audio: { url: audioUrl },
      mimetype: 'audio/mp4',
      ptt: true,
      contextInfo: {
        externalAdReply: {
          title: '✨ SILVA MD Experience',
          body: 'Advanced AI-Powered Bot',
          thumbnailUrl: menuThumbnail,
          mediaType: 1,
          renderLargerThumbnail: true
        }
      }
    }, { quoted: m })

  } catch (err) {
    console.error('[MENU ERROR]', err)
    await m.reply('❌ Menu failed to load. Try again shortly.')
  }
}

handler.help = ['menu']
handler.tags = ['core']
handler.command = ['menu', 'help']

export default handler

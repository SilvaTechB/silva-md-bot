import os from 'os'
import fs from 'fs'
import path from 'path'
import moment from 'moment-timezone'

let handler = async (m, { conn, usedPrefix }) => {
  const audioUrl = 'https://github.com/SilvaTechB/silva-md-bot/raw/main/media/Menu.mp3'
  const thumbnailUrl = 'https://i.imgur.com/QThBEQ7.jpeg'

  const uptime = process.uptime()
  const hours = Math.floor(uptime / 3600)
  const minutes = Math.floor((uptime % 3600) / 60)
  const seconds = Math.floor(uptime % 60)
  const uptimeStr = `${hours}h ${minutes}m ${seconds}s`

  const currentTime = moment.tz('Africa/Nairobi').format('hh:mm A')
  const currentDate = moment.tz('Africa/Nairobi').format('DD MMM YYYY')
  const totalRAM = (os.totalmem() / (1024 ** 3)).toFixed(1)
  const usedRAM = ((os.totalmem() - os.freemem()) / (1024 ** 3)).toFixed(1)
  const pluginCount = Object.keys(global.plugins).length
  const p = usedPrefix

  const tagMap = {}
  for (const [filename, plugin] of Object.entries(global.plugins)) {
    if (!plugin || plugin.disabled) continue
    const tags = plugin.tags || ['other']
    const cmds = plugin.command || plugin.help || []
    let cmdNames = extractCmdNames(cmds)
    if (cmdNames.length === 0) continue
    const tagList = Array.isArray(tags) ? tags : [tags]
    for (const tag of tagList) {
      const t = tag || 'other'
      if (!tagMap[t]) tagMap[t] = []
      tagMap[t].push(...cmdNames)
    }
  }

  const categoryConfig = {
    'AI': { icon: '🤖', title: 'AI & CHATBOT' },
    'main': { icon: '📋', title: 'MAIN' },
    'group': { icon: '👥', title: 'GROUP' },
    'owner': { icon: '👑', title: 'OWNER' },
    'tools': { icon: '🛠️', title: 'TOOLS' },
    'downloader': { icon: '📥', title: 'DOWNLOADER' },
    'dl': { icon: '📥', title: 'DOWNLOADER' },
    'sticker': { icon: '🎨', title: 'STICKER' },
    'fun': { icon: '🎭', title: 'FUN' },
    'economy': { icon: '💰', title: 'ECONOMY' },
    'econ': { icon: '💰', title: 'ECONOMY' },
    'maker': { icon: '🖌️', title: 'MAKER' },
    'anime': { icon: '🌸', title: 'ANIME' },
    'images': { icon: '🖼️', title: 'IMAGES' },
    'image': { icon: '🖼️', title: 'IMAGES' },
    'nsfw': { icon: '🔞', title: 'NSFW' },
    'news': { icon: '📰', title: 'NEWS' },
    'cmd': { icon: '⚙️', title: 'SYSTEM' },
    'system': { icon: '⚙️', title: 'SYSTEM' },
    'relation': { icon: '💕', title: 'RELATION' },
    'rg': { icon: '🎲', title: 'RANDOM' },
    'pies': { icon: '🦶', title: 'RANDOM' },
    'sfw': { icon: '🦶', title: 'RANDOM' },
    'other': { icon: '📦', title: 'OTHER' },
  }

  const merged = {}
  for (const [tag, cmds] of Object.entries(tagMap)) {
    const cfg = categoryConfig[tag] || categoryConfig['other']
    const title = cfg.title
    if (!merged[title]) merged[title] = { icon: cfg.icon, cmds: [] }
    merged[title].cmds.push(...cmds)
  }

  for (const key of Object.keys(merged)) {
    merged[key].cmds = [...new Set(merged[key].cmds)].sort()
  }

  const order = ['AI & CHATBOT', 'MAIN', 'GROUP', 'OWNER', 'TOOLS', 'DOWNLOADER', 'STICKER', 'FUN', 'ECONOMY', 'MAKER', 'ANIME', 'IMAGES', 'NEWS', 'RELATION', 'RANDOM', 'SYSTEM', 'NSFW', 'OTHER']
  const sortedKeys = Object.keys(merged).sort((a, b) => {
    const ia = order.indexOf(a), ib = order.indexOf(b)
    return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib)
  })

  let totalCmds = 0
  let sections = ''
  for (const title of sortedKeys) {
    const { icon, cmds } = merged[title]
    totalCmds += cmds.length
    const cmdList = cmds.map(c => `│  ${p}${c}`).join('\n')
    sections += `
╭──── ${icon} *${title}* ────
${cmdList}
╰────────────────\n`
  }

  const greeting = getGreeting()

  const menuTemplate = `╭━━━━━━━━━━━━━━━━━━━╮
┃  *𝐒𝐈𝐋𝐕𝐀 𝐌𝐃 𝐁𝐎𝐓*
╰━━━━━━━━━━━━━━━━━━━╯

*${greeting}, ${m.pushName || 'User'}!* 👋

╭── *BOT INFO* ──
│ *Bot:* ${global.botname || 'SILVA MD'}
│ *Prefix:* [ ${p} ]
│ *Plugins:* ${pluginCount}
│ *Commands:* ${totalCmds}
│ *Uptime:* ${uptimeStr}
│ *RAM:* ${usedRAM}/${totalRAM} GB
│ *Time:* ${currentTime}
│ *Date:* ${currentDate}
╰─────────────────

*Type ${p}help <command> for details*
*Example:* ${p}help sticker
${sections}
> *SILVA MD BOT v3.0* | silvatechb.com`

  await conn.sendMessage(
    m.chat,
    {
      text: menuTemplate,
      contextInfo: {
        externalAdReply: {
          title: '𝐒𝐈𝐋𝐕𝐀 𝐌𝐃 𝐁𝐎𝐓',
          body: `${pluginCount} Plugins | ${totalCmds} Commands`,
          thumbnailUrl: thumbnailUrl,
          sourceUrl: 'https://whatsapp.com/channel/0029VaAkETLLY6d8qhLmZt2v',
          mediaType: 1,
          renderLargerThumbnail: true,
        },
      },
    },
    { quoted: m }
  )

  await conn.sendMessage(
    m.chat,
    {
      audio: { url: audioUrl },
      mimetype: 'audio/mp4',
      ptt: true,
    },
    { quoted: m }
  )
}

function getGreeting() {
  const hour = moment.tz('Africa/Nairobi').format('HH')
  if (hour < 4) return 'Good Night 🌙'
  if (hour < 12) return 'Good Morning 🌅'
  if (hour < 16) return 'Good Afternoon ☀️'
  if (hour < 19) return 'Good Evening 🌇'
  return 'Good Night 🌙'
}

function extractCmdNames(cmds) {
  let cmdNames = []
  if (typeof cmds === 'string') {
    cmdNames.push(cmds)
  } else if (cmds instanceof RegExp) {
    const src = cmds.source
      .replace(/^\^?\(?\^?/, '').replace(/\)?\$?$/, '')
      .replace(/\\/g, '')
    const parts = src.split('|').filter(s => s && s.length < 20 && !/[^a-zA-Z0-9_-]/.test(s))
    if (parts.length > 0) cmdNames.push(...parts.slice(0, 3))
  } else if (Array.isArray(cmds)) {
    for (const c of cmds) {
      if (typeof c === 'string') cmdNames.push(c)
      else if (c instanceof RegExp) {
        const src = c.source
          .replace(/^\^?\(?\^?/, '').replace(/\)?\$?$/, '')
          .replace(/\\/g, '')
        const parts = src.split('|').filter(s => s && s.length < 20 && !/[^a-zA-Z0-9_-]/.test(s))
        if (parts.length > 0) cmdNames.push(...parts.slice(0, 3))
      }
    }
  }
  return cmdNames
}

handler.help = ['menu']
handler.tags = ['main']
handler.command = ['menu', 'help', 'menu2', 'menu3', 'menu4', 'help2', 'help3']

export default handler

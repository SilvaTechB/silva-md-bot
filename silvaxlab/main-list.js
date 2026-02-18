import moment from 'moment-timezone'

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

let handler = async (m, { conn, usedPrefix, command }) => {
  const p = usedPrefix
  const thumbnailUrl = 'https://i.imgur.com/QThBEQ7.jpeg'

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

  const categories = {
    'list': {
      title: '📋 SILVA MD CATEGORIES',
      text: () => {
        const cats = [
          ['🤖', 'aimenu', 'AI & Chatbot commands'],
          ['👥', 'groupmenu', 'Group management tools'],
          ['👑', 'ownermenu', 'Owner-only commands'],
          ['🛠️', 'toolmenu', 'Utility tools & converters'],
          ['📥', 'dlmenu', 'Media downloaders'],
          ['🎨', 'stickermenu', 'Sticker creation tools'],
          ['🎭', 'funmenu', 'Fun & entertainment'],
          ['💰', 'economymenu', 'Economy & games'],
          ['🖌️', 'makermenu', 'Image makers & logos'],
          ['🌸', 'animemenu', 'Anime pictures & info'],
          ['🖼️', 'imagemenu', 'Image generation'],
          ['📰', 'newsmenu', 'News & updates'],
          ['🎲', 'gamemenu', 'Games & random'],
          ['🔞', 'nsfwmenu', 'NSFW commands'],
        ]
        return `╭━━━ *SILVA MD BOT* ━━━╮
┃ Choose a category below
╰━━━━━━━━━━━━━━━━━━━╯

${cats.map(([icon, cmd, desc]) => `${icon} *${p}${cmd}*\n   _${desc}_`).join('\n\n')}

╭─────────────────╮
│ *TIP:* Type any category
│ command to see its
│ available commands
╰─────────────────╯`
      }
    },
    'aimenu': {
      title: '🤖 AI & CHATBOT',
      tags: ['AI'],
    },
    'botmenu': {
      title: '⚙️ BOT COMMANDS',
      tags: ['main', 'system', 'cmd'],
    },
    'ownermenu': {
      title: '👑 OWNER COMMANDS',
      tags: ['owner'],
    },
    'groupmenu': {
      title: '👥 GROUP COMMANDS',
      tags: ['group'],
    },
    'dlmenu': {
      title: '📥 DOWNLOADER',
      tags: ['downloader', 'dl'],
    },
    'downloadermenu': {
      title: '📥 DOWNLOADER',
      tags: ['downloader', 'dl'],
    },
    'toolmenu': {
      title: '🛠️ TOOLS',
      tags: ['tools'],
    },
    'stickermenu': {
      title: '🎨 STICKER',
      tags: ['sticker'],
    },
    'funmenu': {
      title: '🎭 FUN',
      tags: ['fun'],
    },
    'economymenu': {
      title: '💰 ECONOMY',
      tags: ['economy', 'econ'],
    },
    'gamemenu': {
      title: '🎲 GAMES',
      tags: ['rg', 'pies', 'sfw'],
    },
    'animemenu': {
      title: '🌸 ANIME',
      tags: ['anime'],
    },
    'makermenu': {
      title: '🖌️ MAKER & LOGO',
      tags: ['maker', 'image'],
    },
    'logomenu': {
      title: '🖌️ MAKER & LOGO',
      tags: ['maker', 'image'],
    },
    'imagemenu': {
      title: '🖼️ IMAGES',
      tags: ['images'],
    },
    'nsfwmenu': {
      title: '🔞 NSFW',
      tags: ['nsfw'],
    },
    'newsmenu': {
      title: '📰 NEWS',
      tags: ['news'],
    },
  }

  const cat = categories[command]
  if (!cat) {
    return m.reply(`Unknown category. Type *${p}list* to see all categories.`)
  }

  let text
  if (cat.text) {
    text = cat.text()
  } else {
    const matchTags = cat.tags || []
    let cmds = []
    for (const t of matchTags) {
      if (tagMap[t]) cmds.push(...tagMap[t])
    }
    cmds = [...new Set(cmds)].sort()

    if (cmds.length === 0) {
      text = `${cat.title}\n\n_No commands available in this category._`
    } else {
      const cmdList = cmds.map(c => `│ ${p}${c}`).join('\n')
      text = `╭━━━ ${cat.title} ━━━╮
┃ ${cmds.length} commands available
╰━━━━━━━━━━━━━━━━━━━╯

╭────────────────
${cmdList}
╰────────────────

> Type *${p}help <command>* for details
> *SILVA MD BOT v3.0*`
    }
  }

  await conn.sendMessage(
    m.chat,
    {
      text: text,
      contextInfo: {
        externalAdReply: {
          title: cat.title || '𝐒𝐈𝐋𝐕𝐀 𝐌𝐃 𝐁𝐎𝐓',
          body: 'Powered by SilvaTech Inc.',
          thumbnailUrl: thumbnailUrl,
          sourceUrl: 'https://whatsapp.com/channel/0029VaAkETLLY6d8qhLmZt2v',
          mediaType: 1,
          renderLargerThumbnail: true,
        },
      },
    },
    { quoted: m }
  )
  m.react('✅')
}

handler.help = [
  'list',
  'aimenu',
  'botmenu',
  'ownermenu',
  'groupmenu',
  'dlmenu',
  'downloadermenu',
  'economymenu',
  'funmenu',
  'gamemenu',
  'stickermenu',
  'nsfwmenu',
  'logomenu',
  'makermenu',
  'toolmenu',
  'animemenu',
  'imagemenu',
  'newsmenu',
]
handler.tags = ['main']
handler.command = [
  'list',
  'aimenu',
  'botmenu',
  'ownermenu',
  'groupmenu',
  'dlmenu',
  'downloadermenu',
  'economymenu',
  'funmenu',
  'gamemenu',
  'stickermenu',
  'nsfwmenu',
  'logomenu',
  'makermenu',
  'toolmenu',
  'animemenu',
  'imagemenu',
  'newsmenu',
]

export default handler

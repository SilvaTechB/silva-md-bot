//import db from '../lib/database.js'
let handler = async (m, { conn, usedPrefix, command, args, isOwner, isAdmin, isROwner }) => {
  let isEnable = /true|enable|(turn)?on|1/i.test(command)
  let chat = global.db.data.chats[m.chat]
  let user = global.db.data.users[m.sender]
  let bot = global.db.data.settings[conn.user.jid] || {}

  let type = (args[0] || '').toLowerCase()
  let isAll = false, isUser = false

  // Feature control logic
  switch (type) {
    case 'welcome': // 👋 Sends a greeting message when new users join the group
      if (!m.isGroup) {
        if (!isOwner) return global.dfail('group', m, conn)
      } else if (!isAdmin) return global.dfail('admin', m, conn)
      chat.welcome = isEnable
      break

    case 'jarvis': case 'autotalk': // 🤖 Auto-reply using Jarvis mode
      if (m.isGroup && !(isAdmin || isOwner)) return global.dfail('admin', m, conn)
      chat.jarvis = isEnable
      break

    case 'pmblocker': // 🚫 Block private messages from unknown users
      isAll = true
      if (!isROwner) return global.dfail('rowner', m, conn)
      bot.pmblocker = isEnable
      break

    case 'autobio': // ✍️ Automatically updates bot bio
      isAll = true
      if (!isROwner) return global.dfail('rowner', m, conn)
      bot.autoBio = isEnable
      break

    case 'detect': case 'detector': // 🔎 Detect who deletes messages or joins
      if (!m.isGroup || !isAdmin) return global.dfail('admin', m, conn)
      chat.detect = isEnable
      break

    case 'autosticker': // 🖼️ Converts images to stickers automatically
      if (m.isGroup && !(isAdmin || isOwner)) return global.dfail('admin', m, conn)
      chat.autosticker = isEnable
      break

    case 'antispam': // ❗ Prevent spam messages
      if (m.isGroup && !(isAdmin || isOwner)) return global.dfail('admin', m, conn)
      chat.antiSpam = isEnable
      break

    case 'antidelete': // 🗑️ Restores deleted messages
      if (m.isGroup && !(isAdmin || isOwner)) return global.dfail('admin', m, conn)
      chat.delete = !isEnable
      break

    case 'antitoxic': case 'antibadword': // 🚫 Filters bad words
      if (m.isGroup && !(isAdmin || isOwner)) return global.dfail('admin', m, conn)
      chat.antiToxic = isEnable
      break

    case 'document': // 📎 Forces replies in document format
      if (m.isGroup && !(isAdmin || isOwner)) return global.dfail('admin', m, conn)
      chat.useDocument = isEnable
      break

    case 'autostatus': // 👁️ View others' status automatically
      isAll = true
      if (!isROwner) return global.dfail('rowner', m, conn)
      chat.viewStory = isEnable
      break

    case 'antilink': // 🔗 Blocks WhatsApp group links
      if (m.isGroup && !(isAdmin || isOwner)) return global.dfail('admin', m, conn)
      chat.antiLink = isEnable
      break

    case 'nsfw': // 🔞 Enables NSFW content
      if (m.isGroup && !(isAdmin || isOwner)) return global.dfail('admin', m, conn)
      chat.nsfw = isEnable
      break

    case 'autolevelup': // ⬆️ Auto level-up feature for users
      isUser = true
      user.autolevelup = isEnable
      break

    case 'chatbot': // 🤖 Chat AI mode
      if (m.isGroup && !(isAdmin || isOwner)) return global.dfail('admin', m, conn)
      chat.chatbot = isEnable
      break

    case 'restrict': // ⚙️ Restrict group-only features
      isAll = true
      if (!isOwner) return global.dfail('owner', m, conn)
      bot.restrict = isEnable
      break

    case 'autotype': case 'alwaysonline': // ⌛ Show always-online status
      isAll = true
      if (!isOwner) return global.dfail('owner', m, conn)
      chat.autotype = isEnable
      break

    case 'anticall': // 📵 Prevents calls to bot
      isAll = true
      if (!isOwner) return global.dfail('owner', m, conn)
      bot.antiCall = isEnable
      break

    case 'onlypv': case 'onlydm': case 'onlymd': // 👤 Enables bot in DM only
      isAll = true
      if (!isROwner) return global.dfail('rowner', m, conn)
      global.opts['pconly'] = isEnable
      break

    case 'gponly': // 👥 Enables bot in groups only
      isAll = true
      if (!isROwner) return global.dfail('rowner', m, conn)
      global.opts['gconly'] = isEnable
      break

    case 'self': // 🤖 Bot switches to self mode (only owner)
      isAll = true
      if (!isROwner) return global.dfail('rowner', m, conn)
      global.opts['self'] = isEnable
      break

    default:
      return m.reply(`
╭━━━『 *⚙️ ENABLE/DISABLE OPTIONS* 』━━━╮
┃
┃ 👮 Admin Options:
┃ ─ welcome | antilink | detect
┃ ─ jarvis | autosticker | antispam
┃ ─ antitoxic | nsfw
┃
┃ 👤 User Option:
┃ ─ autolevelup | chatbot
┃
┃ 👑 Owner Options:
┃ ─ autobio | autotype | pmblocker
┃ ─ restrict | self | gponly | onlypv
┃
┃ ✨ Example:
┃ ${usedPrefix}on welcome
┃ ${usedPrefix}off jarvis
┃
╰━━━━━━━━━━━━━━━━━━━━╯`)
  }

  // Response with old-style interactive button
  let status = isEnable ? '✅ Enabled' : '❌ Disabled'
  await conn.sendMessage(m.chat, {
    location: {
      degreesLatitude: 0.0,
      degreesLongitude: 0.0
    },
    caption: `*⚙️ ${type.toUpperCase()} feature is now:* ${status}`,
    footer: 'Silva MD Bot - Settings Panel',
    buttons: [
      {
        buttonId: `${usedPrefix}${isEnable ? 'off' : 'on'} ${type}`,
        buttonText: { displayText: `${isEnable ? 'Disable' : 'Enable'} Again` },
        type: 1
      }
    ],
    headerType: 6,
    viewOnce: true
  }, { quoted: m })
}
handler.help = ['enable <option>', 'disable <option>']
handler.tags = ['config']
handler.command = /^((en|dis)able|(turn)?o(n|ff)|[01])$/i
export default handler
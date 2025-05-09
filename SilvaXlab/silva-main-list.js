let handler = async (m, { conn, usedPrefix, command }) => {
  let who = m.quoted
    ? m.quoted.sender
    : m.mentionedJid && m.mentionedJid[0]
      ? m.mentionedJid[0]
      : m.fromMe
        ? conn.user.jid
        : m.sender

  if (!(who in global.db.data.users)) throw `✳️ User not found in database.`

  let pp = './media/shizo.jpg'
  let more = String.fromCharCode(8206)
  let readMore = more.repeat(850)

  let lkr
  switch (command) {
    case 'list':
      lkr = `
🌟 *SilvaBot Command Center* 🌟
${readMore}
Here are your command gateways:

🎛️ *${usedPrefix}botmenu* – Core Bot Features  
🛡️ *${usedPrefix}ownermenu* – Owner's Privileges  
👥 *${usedPrefix}groupmenu* – Group Controls  
📦 *${usedPrefix}dlmenu* – Download Tools  
🎭 *${usedPrefix}funmenu* – Just for Fun  
💰 *${usedPrefix}economymenu* – Game Economy  
🎮 *${usedPrefix}gamemenu* – Minigames  
🎨 *${usedPrefix}stickermenu* – Sticker Magic  
🧰 *${usedPrefix}toolmenu* – Utility Toolkit  
🧠 *${usedPrefix}logomenu* – Logo Generator  
🌙 *${usedPrefix}nsfwmenu* – NSFW Commands (18+)

✨ _Type any of the above commands to open the respective menu._`
      break

    case 'botmenu':
      lkr = `
╭━━━⌜ 🤖 ʙᴏᴛ ᴍᴇɴᴜ ⌟━━━╮
┃📡 _${usedPrefix}gita_
┃📶 _${usedPrefix}ping_
┃🕒 _${usedPrefix}uptime_
┃🤖 _${usedPrefix}bot_
┃👤 _${usedPrefix}owner_
┃📜 _${usedPrefix}script_
┃🧭 _${usedPrefix}runtime_
┃ℹ️ _${usedPrefix}infobot_
┃💗 _${usedPrefix}donate_
┃🌐 _${usedPrefix}groups_
┃🚫 _${usedPrefix}blocklist_
┃🔖 _${usedPrefix}listprem_
┃🎓 _Silva AI_
╰━━━━━━━━━━━━━━━━━━╯`
      break

    case 'ownermenu':
      lkr = `
╭━━━⌜ 👑 ᴏᴡɴᴇʀ ᴍᴇɴᴜ ⌟━━━╮
┃🚫 _${usedPrefix}banchat / unbanchat_
┃⚒️ _${usedPrefix}banuser / unbanuser_
┃📢 _${usedPrefix}broadcast / broadcastgc_
┃🔗 _${usedPrefix}join_
┃🖼️ _${usedPrefix}setppbot_
┃🔠 _${usedPrefix}setprefix / resetprefix_
┃📁 _${usedPrefix}getfile / getplugin_
╰━━━━━━━━━━━━━━━━━━╯`
      break

    case 'groupmenu':
      lkr = `
╭━━━⌜ 👥 ɢʀᴏᴜᴘ ᴍᴇɴᴜ ⌟━━━╮
┃🚷 _${usedPrefix}kick @tag_
┃📈 _${usedPrefix}promote @tag_
┃📉 _${usedPrefix}demote @tag_
┃📋 _${usedPrefix}infogroup_
┃🔗 _${usedPrefix}link / resetlink_
┃🖼️ _${usedPrefix}setpp [img]_
┃📝 _${usedPrefix}setname / setdesc_
┃👋 _${usedPrefix}setwelcome / setbye_
┃🔇 _${usedPrefix}hidetag [msg]_
┃⚠️ _${usedPrefix}warn / unwarn_
┃🔐 _${usedPrefix}group open/close_
┃🛠️ _${usedPrefix}enable / disable_
╰━━━━━━━━━━━━━━━━━━╯`
      break

    case 'dlmenu':
      lkr = `
╭━━━⌜ 📥 ᴅᴏᴡɴʟᴏᴀᴅᴇʀ ⌟━━━╮
┃🎵 _${usedPrefix}play / song_
┃📹 _${usedPrefix}ytv / ytmp4_
┃🎧 _${usedPrefix}yta / ytmp3_
┃🖼️ _${usedPrefix}gimage / pinterest_
┃📁 _${usedPrefix}mediafire / gdrive_
┃🐱‍🏍 _${usedPrefix}gitclone / github_
┃🐤 _${usedPrefix}twitter_
┃🎶 _${usedPrefix}spotify_
┃🎥 _${usedPrefix}tiktok / instagram_
┃📘 _${usedPrefix}facebook_
╰━━━━━━━━━━━━━━━━━━╯`
      break

    case 'economymenu':
      lkr = `
╭━━━⌜ 💰 ᴇᴄᴏɴᴏᴍʏ ⌟━━━╮
┃🪙 _${usedPrefix}daily / weekly / monthly_
┃🏆 _${usedPrefix}leaderboard_
┃🎲 _${usedPrefix}bet / gamble_
┃💪 _${usedPrefix}heal / adventure_
┃⛏️ _${usedPrefix}mine / work_
┃🛒 _${usedPrefix}shop / sell_
┃🔄 _${usedPrefix}transfer / todia / tomoney_
┃🎁 _${usedPrefix}opencrate / claim_
┃🔧 _${usedPrefix}craft_
┃📊 _${usedPrefix}balance_
╰━━━━━━━━━━━━━━━━━━╯`
      break

    case 'funmenu':
      lkr = `
╭━━━⌜ 🎭 ꜰᴜɴ ᴍᴇɴᴜ ⌟━━━╮
┃🕵️ _${usedPrefix}character_
┃💬 _${usedPrefix}truth / dare_
┃💘 _${usedPrefix}flirt / ship_
┃🏳️‍🌈 _${usedPrefix}gay_
┃🎤 _${usedPrefix}shayeri / ytcomment_
┃😂 _${usedPrefix}stupid / lolicon_
┃🎴 _${usedPrefix}simpcard / hornycard_
╰━━━━━━━━━━━━━━━━━━╯`
      break

    default:
      lkr = '❌ Invalid menu. Try again using a correct menu command.'
      break
  }

  // Unique modern reply
  conn.sendMessage(m.chat, {
    image: { url: pp },
    caption: lkr.trim(),
    contextInfo: {
      mentionedJid: [m.sender],
      forwardingScore: 999,
      isForwarded: true,
      forwardedNewsletterMessageInfo: {
        newsletterJid: '120363200367779016@newsletter',
        newsletterName: '◢◤ Silva Md Bot ◢◤',
        serverMessageId: 143
      }
    }
  }, { quoted: m })
}

handler.help = ['list', 'botmenu', 'ownermenu', 'groupmenu', 'dlmenu', 'economymenu', 'funmenu']
handler.tags = ['main']
handler.command = ['list', 'botmenu', 'ownermenu', 'groupmenu', 'dlmenu', 'economymenu', 'funmenu']

export default handler

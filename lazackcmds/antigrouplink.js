export async function all(m) {
  const botSettings = global.db.data.settings[this.user.jid] || {}

  // Run only in groups
  if (!m.isGroup) return

  const isGroupInvite =
    m.mtype === 'groupInviteMessage' ||
    m.text?.startsWith?.('https://chat') ||
    m.text?.toLowerCase?.().includes('open this link')

  if (!isGroupInvite) return

  // ENV variable check (e.g., ANTI_LINK=true)
  const isAntilinkEnabled = process.env.ANTILINK === 'true'
  const isBotAdmin = m.isBotAdmin
  const senderUsername = m.sender?.split('@')[0] || 'user'

  const contextInfo = {
    forwardingScore: 999,
    isForwarded: true,
    forwardedNewsletterMessageInfo: {
      newsletterJid: '120363026198979636@newsletter',
      serverMessageId: '143',
      newsletterName: 'Silva MD Bot Official'
    }
  }

  if (isAntilinkEnabled && isBotAdmin) {
    // Delete the message containing the link
    await this.sendMessage(m.chat, {
      delete: m.key
    })

    // Notify group after deletion
    await this.sendMessage(
      m.chat,
      {
        text: `🚫 *Group Link Deleted*\n\n@${senderUsername}, posting group links is not allowed.`,
        mentions: [m.sender],
        contextInfo
      },
      { quoted: m }
    )

    await m.react('❌')
  } else if (isAntilinkEnabled && !isBotAdmin) {
    // Bot can't delete, but warn the sender
    await this.sendMessage(
      m.chat,
      {
        text: `⚠️ *Antilink is enabled, but I'm not an admin.*\n@${senderUsername}, I need admin rights to delete such messages.`,
        mentions: [m.sender],
        contextInfo
      },
      { quoted: m }
    )
  }

  return true
}

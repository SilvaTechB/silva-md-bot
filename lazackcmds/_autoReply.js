export async function all(m) {
  const botSettings = global.db.data.settings[this.user.jid] || {}

  const isGroupInvite =
    m.mtype === 'groupInviteMessage' ||
    m.text?.startsWith?.('https://chat') ||
    m.text?.toLowerCase?.().includes('open this link')

  // Respond only in private chats and ignore messages from the bot itself
  if (isGroupInvite && !m.isBaileys && !m.isGroup) {
    const senderUsername = m.sender?.split('@')[0] || 'user'

    await this.sendMessage(
      m.chat,
      {
        text: `🚫 *Group Invite Detected*\n\nHello @${senderUsername}, you cannot send group links here.\n\n🤖 *Want to add this bot to your group?*\n📩 Type \`\`\`.owner\`\`\` to contact the owner.\n💼 _Bot rental available!_`,
        mentions: [m.sender],
        contextInfo: {
          forwardingScore: 999,
      isForwarded: true,
      forwardedNewsletterMessageInfo: {
        newsletterJid: '120363200367779016@newsletter',
        newsletterName: '◢◤ Silva Md Bot ◢◤',
        serverMessageId: 143
          }
        }
      },
      { quoted: m }
    )

    await m.react('☠️')
  }

  return true
}

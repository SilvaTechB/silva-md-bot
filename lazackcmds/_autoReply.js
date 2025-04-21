export async function all(m) {
  const bot = global.db.data.settings[this.user.jid] || {}

  const isGroupInvite =
    m.mtype === 'groupInviteMessage' ||
    m.text?.startsWith?.('https://chat') ||
    m.text?.toLowerCase?.().includes('open this link')

  // Only trigger in private chats and if it's not from the bot itself
  if (isGroupInvite && !m.isBaileys && !m.isGroup) {
    await this.sendMessage(
      m.chat,
      {
        text: `🚫 *Group Invite Detected*\n\nHello @${m.sender.split('@')[0]}, you cannot send group links here.\n\n🤖 *Want to add this bot to your group?*\n📩 Type \`\`\`.owner\`\`\` to contact the owner.\n💼 _Bot rental available!_`,
        mentions: [m.sender],
        contextInfo: {
          forwardingScore: 999,
          isForwarded: true,
          forwardedNewsletterMessageInfo: {
            newsletterJid: '120363026198979636@newsletter',
            serverMessageId: '',
            newsletterName: 'Silva MD Bot Official'
          }
        }
      },
      { quoted: m }
    )

    await m.react('😡')
  }

  return !0
}

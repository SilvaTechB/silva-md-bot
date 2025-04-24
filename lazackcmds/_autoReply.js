export async function all(m) {
  const settings = global.db.data.settings[this.user.jid] || {};

  // Check if message is a group invite or contains typical group invite phrases
  const isGroupInvite =
    m.mtype === 'groupInviteMessage' ||
    m.text?.startsWith?.('https://chat') ||
    m.text?.toLowerCase?.().includes('open this link');

  // Trigger only if it's a group invite, not from bot, and in private chat
  if (isGroupInvite && !m.isBaileys && !m.isGroup) {
    const username = m.sender?.split('@')[0] || 'user';

    const message = {
      text: `🚫 *Group Invite Detected*\n\nHello @${username}, you cannot send group links here.\n\n🤖 *Want to add this bot to your group?*\n📩 Type \`\`\`.owner\`\`\` to contact the owner.\n💼 _Bot rental available!_`,
      mentions: [m.sender],
      contextInfo: {
        forwardingScore: 999,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
          newsletterJid: '120363200367779016@newsletter',
          newsletterName: '◢◤ Silva Md Bot ◢◤',
          serverMessageId: 143,
        }
      }
    };

    await this.sendMessage(m.chat, message, { quoted: m });
    await m.react('☠️');
  }

  return true;
}

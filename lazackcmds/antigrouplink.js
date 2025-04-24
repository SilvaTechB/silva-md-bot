export async function all(m) {
  const settings = global.db.data.settings[this.user.jid] || {};

  // 🛑 Feature toggle from environment
  const antilinkEnabled = process.env.ANTILINK === 'true';
  if (!antilinkEnabled) return true;

  const isGroupInvite =
    m.mtype === 'groupInviteMessage' ||
    m.text?.startsWith?.('https://chat') ||
    m.text?.toLowerCase?.().includes('open this link');

  if (isGroupInvite && m.isGroup && !m.isBaileys) {
    const groupMetadata = await this.groupMetadata(m.chat);
    const botNumber = this.user.jid;
    const isBotAdmin = groupMetadata.participants
      .find(p => p.id === botNumber)?.admin === 'admin';

    const senderUsername = m.sender?.split('@')[0] || 'user';

    const commonContext = {
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

    if (isBotAdmin) {
      // Delete group link
      await this.sendMessage(m.chat, {
        delete: {
          remoteJid: m.chat,
          fromMe: false,
          id: m.key.id,
          participant: m.sender
        }
      });

      await this.sendMessage(m.chat, {
        text: `🚫 @${senderUsername}, group links are not allowed in this group.`,
        ...commonContext
      });

    } else {
      // Notify if not admin
      await this.sendMessage(m.chat, {
        text: `🚫 Group link detected from @${senderUsername}, but I can't delete it because I'm not an admin.\n\n👑 Ask an admin to promote me for better moderation.`,
        ...commonContext
      });
    }

    await m.react('⚠️');
  }

  return true;
}

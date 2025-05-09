import { areJidsSameUser } from '@whiskeysockets/baileys'

export async function before(m, { participants, conn }) {
  if (!m.isGroup) return;

  let chat = global.db.data.chats[m.chat];
  if (!chat?.antiBotClone) return;

  let botJid = global.conn.user.jid; // Main bot's JID
  if (botJid === conn.user.jid) return;

  let isBotPresent = participants.some(p => areJidsSameUser(botJid, p.id));
  if (isBotPresent) {
    setTimeout(async () => {
      await m.reply(`⚠️ No duplicate bots allowed in this group. I will now leave.`, null, fwc);
      await conn.groupLeave(m.chat);
    }, 5000); // Wait for 5 seconds
  }
}

var { proto } = require('@whiskeysockets/baileys');

// Load env variables
var anticallEnabled = process.env.ANTICALL === 'true';
var autoBlockEnabled = process.env.AUTOBLOCK_CALL === 'true';

// Optional whitelist
var whitelist = [
  // '2547xxxxxxx@s.whatsapp.net' // Add safe numbers here if needed
];

var handler = async (m, { conn }) => {
  if (!anticallEnabled) return;

  if (m.messageStubType !== 28) return;

  const callerId = m.key.participant || m.key.remoteJid;
  if (!callerId || callerId.endsWith('@g.us')) return;

  if (whitelist.includes(callerId)) {
    console.log(`[✅ Whitelisted] ${callerId} called the bot (allowed).`);
    return;
  }

  // Send warning message
  const warnText = `🚫 *Anti-Call Notice*\n\nYou tried to call this silva md bot.\nPlease do not call — such actions result in a block.`;
  await conn.sendMessage(callerId, { text: warnText });

  // Block if enabled
  if (autoBlockEnabled) {
    await new Promise(resolve => setTimeout(resolve, 3000));
    await conn.updateBlockStatus(callerId, 'block');
    console.log(`[❌ Blocked] ${callerId} tried calling the bot.`);
  }
};

handler.customPrefix = /.*/;
handler.command = new RegExp;
handler.anticall = true;

module.exports = handler;

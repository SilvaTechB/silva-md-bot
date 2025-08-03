import chalk from 'chalk';

/**
 * Main handler for all incoming messages
 * @param {object} msg - Incoming message object from Baileys
 */
async function handler({ messages, type }, conn) {
  try {
    const m = messages[0];
    if (!m.message) return;

    const from = m.key.remoteJid;
    const isGroup = from.endsWith('@g.us');
    const sender = m.key.participant || m.key.remoteJid;
    const text = m.message.conversation || m.message.extendedTextMessage?.text || '';

    // Ignore if message is empty or status update
    if (!text || m.key.fromMe) return;

    console.log(chalk.blue(`[📩 New Message] From: ${sender} | Text: ${text}`));

    // ✅ Detect command using prefix
    const prefixRegex = global.prefix;
    const isCmd = prefixRegex.test(text);
    if (!isCmd) return;

    const [command, ...args] = text.slice(1).trim().split(/\s+/); // Remove prefix & split
    const cmdName = command.toLowerCase();

    // ✅ Search in loaded plugins
    const plugin = Object.values(global.plugins).find(p => p?.command?.includes(cmdName));
    if (!plugin) {
      console.log(chalk.red(`❌ Command not found: ${cmdName}`));
      return;
    }

    // ✅ Run command
    try {
      await plugin.run({ conn, m, text, args, sender, isGroup });
      console.log(chalk.green(`✅ Command executed: ${cmdName}`));
    } catch (err) {
      console.error(chalk.red(`❌ Error executing command ${cmdName}:`), err);
      await conn.sendMessage(from, { text: `⚠️ Error: ${err.message}` }, { quoted: m });
    }

  } catch (error) {
    console.error(chalk.red('❌ Handler Error:'), error);
  }
}

export default { handler };

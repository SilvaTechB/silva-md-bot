// Made with ❤️ by Silva
import { cpus as _cpus } from 'os';
import { performance } from 'perf_hooks';
import { sizeFormatter } from 'human-readable';

let format = sizeFormatter({
  std: 'JEDEC',
  decimalPlaces: 2,
  keepTrailingZeroes: false,
  render: (literal, symbol) => `${literal} ${symbol}B`,
});

let handler = async (m, { conn }) => {
  let name = m.pushName || conn.getName(m.sender);
  let _muptime;

  if (process.send) {
    process.send('uptime');
    _muptime = await new Promise(resolve => {
      process.once('message', resolve);
      setTimeout(resolve, 1000);
    }) * 1000;
  }

  let start = performance.now();

  // React with ⏱️ to show processing
  await conn.sendMessage(m.chat, {
    react: {
      text: '⏱️',
      key: m.key,
    },
  });

  // Animated countdown for 2 seconds
  for (let i = 0; i <= 2; i++) {
    let animatedUptime = clockString(_muptime + i * 1000);
    await conn.sendMessage(m.chat, {
      text: `🔄 Updating Runtime...\n\n⏱️ *${animatedUptime.trim()}*`,
    }, { quoted: m });
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  let end = performance.now();
  let latency = (end - start).toFixed(2);
  let cpu = _cpus()[0];

  const finalText = `
╭─❏ SILVA MD UPTIME
*💻 SILVA MD RUNTIME STATS 💻*

⏱️ *Uptime:*\n${clockString(_muptime)}
📡 *Latency:* ${latency} ms

🛠️ *Processor Details:*
- Cores: ${_cpus().length}
- Speed: ${cpu.speed} MHz
- Model: ${cpu.model}

✨ Powered by *Silva MD*
  `.trim();

  // Send final fancy response
  await conn.sendMessage(m.chat, {
    text: finalText,
    contextInfo: {
      mentionedJid: [m.sender],
      forwardingScore: 999,
      isForwarded: true,
      forwardedNewsletterMessageInfo: {
        newsletterJid: '120363200367779016@newsletter',
        newsletterName: 'SILVA MD RUNTIME 💖🦄',
        serverMessageId: 143
      }
    }
  }, { quoted: m });
};

handler.help = ['runtime', 'uptime'];
handler.tags = ['info'];
handler.command = /^(uptime|runtime)$/i;

export default handler;

// Helper function
function clockString(ms) {
  let d = isNaN(ms) ? '--' : Math.floor(ms / 86400000);
  let h = isNaN(ms) ? '--' : Math.floor(ms / 3600000) % 24;
  let m = isNaN(ms) ? '--' : Math.floor(ms / 60000) % 60;
  let s = isNaN(ms) ? '--' : Math.floor(ms / 1000) % 60;
  return [
    d + ' Days ☀️',
    h + ' Hours 🕐',
    m + ' Minutes ⏰',
    s + ' Seconds ⏱️',
  ].join('\n');
}

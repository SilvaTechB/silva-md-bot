// Made with ❤️ by Silva
import { cpus as _cpus } from 'os';
import { performance } from 'perf_hooks';

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

  let muptime = clockString(_muptime);
  let speed = (performance.now() - performance.now()).toFixed(2);
  let cpu = _cpus()[0];

  // Simulated animation using dots
  let dotAnim = '';
  for (let i = 1; i <= 30; i++) dotAnim += '▪️'.repeat(i % 4) + '\n';

  let text = `
╭─❏ *SILVA MD UPTIME*
│ 👤 *User:* @${m.sender.split('@')[0]}
│ 🕒 *Uptime:* ${muptime}
│ 📡 *Latency:* ${speed} ms
│ 🧠 *CPU:* ${cpu.model}
│ ⚙️ *Speed:* ${cpu.speed} MHz
│ 💾 *Cores:* ${_cpus().length}
╰───────────────

🎬 *Runtime Simulation:*
${dotAnim}
`;

  await conn.sendMessage(m.chat, {
  text: text.trim(),
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
handler.command = /^(runtime|uptime)$/i;

export default handler;

function clockString(ms) {
  let d = isNaN(ms) ? '--' : Math.floor(ms / 86400000);
  let h = isNaN(ms) ? '--' : Math.floor(ms / 3600000) % 24;
  let m = isNaN(ms) ? '--' : Math.floor(ms / 60000) % 60;
  let s = isNaN(ms) ? '--' : Math.floor(ms / 1000) % 60;
  return `${d}d ${h}h ${m}m ${s}s`;
}

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
    _muptime = await new Promise((resolve) => {
      process.once('message', resolve);
      setTimeout(resolve, 1000);
    }) * 1000;
  }

  const old = performance.now();
  const con = {
    key: {
      fromMe: false,
      participant: `${m.sender.split`@`[0]}@s.whatsapp.net`,
      ...(m.chat ? { remoteJid: '254700143167@s.whatsapp.net' } : {}),
    },
    message: {
      contactMessage: {
        displayName: `${name}`,
        vcard: `BEGIN:VCARD\nVERSION:3.0\nN:;Silva;;;\nFN:${name}\nitem1.TEL;waid=${m.sender.split('@')[0]}:${m.sender.split('@')[0]}\nitem1.X-ABLabel:Ponsel\nEND:VCARD`,
      },
    },
  };

  await conn.sendMessage(m.chat, {
    react: { text: "⏱️", key: m.key }
  });

  // Animate for 30 seconds
  for (let i = 0; i <= 30; i++) {
    setTimeout(async () => {
      let muptime = clockString(_muptime + i * 1000);
      let latency = (performance.now() - old).toFixed(2);
      let runtime = `${muptime}\n\n📡 *Latency:* ${latency} ms\n\n🛠️ *Processor:*\n• ${_cpus()[0].model}\n• ${_cpus().length} Cores\n• ${_cpus()[0].speed} MHz`;

      await conn.sendMessage(m.chat, {
        caption: runtime,
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
      }, { quoted: con });

      if (i === 30) {
        await conn.sendMessage(m.chat, {
          text: `✅ *This is Silva Md runing time!*\nHope you enjoyed the show, ${name} 💖`,
          contextInfo: {
            mentionedJid: [m.sender]
          }
        }, { quoted: con });
      }
    }, i * 1000);
  }
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
  return `⏳ *Bot Uptime:*\n${d} Days ☀️\n${h} Hours 🕐\n${m} Minutes ⏰\n${s} Seconds ⏱️`;
}

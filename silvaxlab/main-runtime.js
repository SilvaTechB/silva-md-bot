// Made with ❤️ by Silva
import { cpus as _cpus } from 'os';
import { performance } from 'perf_hooks';
import { sizeFormatter } from 'human-readable';

let format = sizeFormatter({
  std: 'JEDEC', // 'SI' (default) | 'IEC' | 'JEDEC'
  decimalPlaces: 2,
  keepTrailingZeroes: false,
  render: (literal, symbol) => `${literal} ${symbol}B`,
});

let handler = async (m, { conn }) => {
  let name = m.pushName || conn.getName(m.sender); // Get sender's name
  let _muptime;

  if (process.send) {
    process.send('uptime');
    _muptime = await new Promise((resolve) => {
      process.once('message', resolve);
      setTimeout(resolve, 1000);
    }) * 1000;
  }

  let muptime = clockString(_muptime);

  const con = {
    key: {
      fromMe: false,
      participant: `${m.sender.split`@`[0]}@s.whatsapp.net`,
      ...(m.chat ? { remoteJid: '254700143167@s.whatsapp.net' } : {}),
    },
    message: {
      contactMessage: {
        displayName: `${name}`,
        vcard: `BEGIN:VCARD\nVERSION:3.0\nN:;a,;;;\nFN:${name}\nitem1.TEL;waid=${m.sender.split('@')[0]}:${m.sender.split('@')[0]}\nitem1.X-ABLabel:Ponsel\nEND:VCARD`,
      },
    },
  };

  const old = performance.now();

  // React to indicate processing
  await conn.sendMessage(m.chat, {
    react: {
      text: `⏱️`,
      key: m.key,
    },
  });

  const neww = performance.now();
  const speed = (neww - old).toFixed(4);

  let text = `${muptime}\n\n📡 *Latency:* ${speed} ms\n\n🛠️ *Processor Details:*\n- Speed: ${_cpus()[0].speed} MHz\n- Cores: ${_cpus().length}`;

  // Send the final response with the custom quoting object
  await conn.sendMessage(m.chat, { text, mentions: [m.sender] }, { quoted: con });
};

handler.help = ['runtime'];
handler.tags = ['info'];
handler.command = /^(uptime|runtime)$/i;

export default handler;

const more = String.fromCharCode(8206);
const readMore = more.repeat(4001);

function clockString(ms) {
  let d = isNaN(ms) ? '--' : Math.floor(ms / 86400000);
  let h = isNaN(ms) ? '--' : Math.floor(ms / 3600000) % 24;
  let m = isNaN(ms) ? '--' : Math.floor(ms / 60000) % 60;
  let s = isNaN(ms) ? '--' : Math.floor(ms / 1000) % 60;
  return [
    d,
    '*Days ☀️*\n',
    h,
    ' *Hours 🕐*\n',
    m,
    ' *Minute ⏰*\n',
    s,
    ' *Second ⏱️* \nSILVA MD UPTIME',
  ]
    .map((v) => v.toString().padStart(2, 0))
    .join('');
}

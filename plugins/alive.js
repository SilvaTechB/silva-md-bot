'use strict';

const os      = require('os');
const config  = require('../config');
const { performance } = require('perf_hooks');
const { getActiveTheme } = require('../lib/theme');
const moment  = require('moment-timezone');

const TZ = 'Africa/Nairobi';

module.exports = {
    commands:    ['alive', 'bot', 'botinfo'],
    description: 'Show bot status with full theme styling',
    permission:  'public',
    group:       true,
    private:     true,

    run: async (sock, message, args, { sender, contextInfo }) => {
        const t = getActiveTheme()?.global || {};

        const start = performance.now();
        const ping  = (performance.now() - start).toFixed(1);

        const upRaw = process.uptime();
        const h = Math.floor(upRaw / 3600);
        const m = Math.floor((upRaw % 3600) / 60);
        const s = Math.floor(upRaw % 60);
        const uptime = `${h}h ${m}m ${s}s`;

        const totalRam = (os.totalmem() / 1073741824).toFixed(2);
        const freeRam  = (os.freemem()  / 1073741824).toFixed(2);
        const usedRam  = (os.totalmem() - os.freemem()) / 1073741824;

        const mode   = (config.MODE || 'PUBLIC').toUpperCase();
        const owner  = config.OWNER_NUMBER || global.botNum || 'Unknown';
        const prefix = config.PREFIX || '.';
        const theme  = (config.THEME || 'silva').toLowerCase();

        const now    = moment().tz(TZ);
        const date   = now.format('ddd, D MMM YYYY');
        const time   = now.format('hh:mm A');

        const botName  = t.botName  || 'Silva MD';
        const footer   = t.footer   || 'Silva MD';
        const alive    = t.alive    || 'System online. All functions nominal.';
        const emoji    = t.aliveEmoji || '⚡';
        const imageUrl = config.ALIVE_IMG || t.pic1 || 'https://files.catbox.moe/5uli5p.jpeg';

        const modeEmoji = mode === 'PUBLIC' ? '🟢' : mode === 'PRIVATE' ? '🔒' : '🔵';

        const caption =
`${emoji}  *${botName}* — is Alive!

╭──────────────────
│ 🤖  *Bot:*      ${botName}
│ 👑  *Owner:*    +${owner}
│ ⏱️  *Uptime:*   ${uptime}
│ ⚡  *Speed:*    ${ping} ms
│ 💾  *RAM:*      ${usedRam.toFixed(2)} / ${totalRam} GB
│ ${modeEmoji}  *Mode:*     ${mode}
│ 🎨  *Theme:*    ${theme}
│ 🔑  *Prefix:*   ${prefix}
│ 📅  *Date:*     ${date}
│ 🕒  *Time:*     ${time}
╰──────────────────

❝ ${alive} ❞

✦ ${footer}`;

        try {
            await sock.sendMessage(sender, {
                image:   { url: imageUrl },
                caption,
                contextInfo
            }, { quoted: message });
        } catch {
            await sock.sendMessage(sender, { text: caption, contextInfo }, { quoted: message });
        }
    }
};

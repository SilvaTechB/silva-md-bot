'use strict';

const { performance } = require('perf_hooks');
const os = require('os');
const config = require('../config');
const { getStr } = require('../lib/theme');


module.exports = {
    commands:    ['ping'],
    description: 'Check bot response time and uptime',
    permission:  'public',
    group:       true,
    private:     true,
    run: async (sock, message, args, { jid, contextInfo, safeSend }) => {
        const start = performance.now();
        await safeSend({ text: '🏓 _Pinging..._' }, { quoted: message });
        const ms = (performance.now() - start).toFixed(2);

        const uptime = process.uptime();
        const h = Math.floor(uptime / 3600);
        const m = Math.floor((uptime % 3600) / 60);
        const s = Math.floor(uptime % 60);

        const totalRam = os.totalmem() / 1073741824;
        const usedRam = (os.totalmem() - os.freemem()) / 1073741824;
        const botName = getStr('botName') || config.BOT_NAME || 'Silva MD';
        const imageUrl = getStr('pic1') || config.ALIVE_IMG || 'https://files.catbox.moe/5uli5p.jpeg';
        const caption = [
            `⚡ *${botName}*`,
            '',
            `🏓 *Ping:* ${ms} ms 🟢`,
            `⏱️ *Uptime:* ${h}h ${m}m ${s}s`,
            `🖥️ *CPU:* ${os.cpus().length} cores`,
            `💾 *RAM:* ${usedRam.toFixed(2)} GB / ${totalRam.toFixed(2)} GB (${((usedRam / totalRam) * 100).toFixed(1)}%)`,
            `📦 *Commands:* ${global.plugins?.flatMap?.(p => p.commands || []).length || '535+'}`,
            '',
            `_${config.MODE || 'public'} mode • Silva Tech Nexus_`,
        ].join('\n');

        await safeSend({ image: { url: imageUrl }, caption, contextInfo }, { quoted: message });
        await safeSend({
            text: 'Tap a quick action',
            footer: `${botName} • Online`,
            buttons: [
                { buttonId: 'silva:ping:menu', buttonText: { displayText: '📦 Menu' }, type: 1 },
                { buttonId: 'silva:ping:stats', buttonText: { displayText: '📊 Stats' }, type: 1 },
                { buttonId: 'silva:ping:ai', buttonText: { displayText: '🧠 AI' }, type: 1 },
            ],
            headerType: 1,
            contextInfo
        }, { quoted: message });
    }
};

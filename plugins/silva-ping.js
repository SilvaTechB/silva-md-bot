const { performance } = require('perf_hooks');

module.exports = async (sock, globalContextInfo, config) => {
    sock.ev.on('messages.upsert', async ({ messages }) => {
        const m = messages[0];
        if (!m.message) return;
        
        const text = m.message.conversation || m.message.extendedTextMessage?.text || '';
        if (!text.startsWith(config.PREFIX)) return;
        
        const cmd = text.slice(config.PREFIX.length).trim().split(/\s+/)[0].toLowerCase();
        
        if (cmd === 'ping') {
            const start = performance.now();
            const sender = m.key.remoteJid;
            await sock.sendMessage(sender, { text: 'Pinging...' });
            const end = performance.now();

            const uptime = process.uptime();
            const uptimeStr = `${Math.floor(uptime / 60)} min ${Math.floor(uptime % 60)} sec`;

            const msg = `✅ *Bot is Online!*\n\n` +
                        `⏱ *Response:* ${(end - start).toFixed(2)} ms\n` +
                        `⏳ *Uptime:* ${uptimeStr}`;

            await sock.sendMessage(sender, {
                text: msg,
                contextInfo: globalContextInfo
            }, { quoted: m });
        }
    });
};

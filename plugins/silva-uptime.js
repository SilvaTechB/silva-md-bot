const os = require('os');

const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${h}h ${m}m ${s}s`;
};

module.exports = {
    commands: ['uptime', 'runtime'],
    handler: async ({ sock, m, sender, contextInfo, config }) => {
        try {
            const uptime = formatTime(process.uptime());
            const cpu = os.cpus()[0].model;
            const platform = os.platform().toUpperCase();
            const totalMem = (os.totalmem() / 1024 / 1024 / 1024).toFixed(2);
            const freeMem = (os.freemem() / 1024 / 1024 / 1024).toFixed(2);
            const latency = new Date().getTime() - m.messageTimestamp * 1000;

            const caption = `
┏━━━━━━━━━━━━━━━┓
      ✦ *Silva MD Runtime* ✦
┗━━━━━━━━━━━━━━━┛

🕒 *Uptime:* ${uptime}
⚡ *Latency:* ${latency} ms
🖥 *CPU:* ${cpu}
🏗 *Platform:* ${platform}
🛠 *RAM:* ${freeMem} GB / ${totalMem} GB

✨ _Powered by Silva Tech Inc_
`.trim();

            await sock.sendMessage(sender, {
                image: { url: config.ALIVE_IMG || 'https://files.catbox.moe/5uli5p.jpeg' },
                caption: caption,
                contextInfo
            }, { quoted: m });
        } catch (error) {
            console.error('❌ Uptime Plugin Error:', error);
            await sock.sendMessage(sender, {
                text: '⚠️ Failed to fetch runtime details.',
                contextInfo
            }, { quoted: m });
        }
    }
};
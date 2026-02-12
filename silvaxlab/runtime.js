// Modern Runtime / Uptime Command — Silva MD Framework
const os = require('os');
const { performance } = require('perf_hooks');

const handler = {
    help: ['runtime', 'uptime'],
    tags: ['info', 'system'],
    command: /^(runtime|uptime)$/i,
    group: false,
    admin: false,
    botAdmin: false,
    owner: false,

    execute: async ({ jid, sock, message }) => {
        try {
            const sender = message.key.participant || message.key.remoteJid;

            // Get uptime safely
            let botUptime = process.uptime() * 1000;

            // Measure latency
            const start = performance.now();
            const end = performance.now();
            const latency = (end - start).toFixed(2);

            // CPU info
            const cpus = os.cpus();
            const cpu = cpus[0];
            const cores = cpus.length;
            const cpuModel = cpu.model.replace(/\s+/g, ' ').trim();

            // Memory
            const usedMem = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);
            const totalMem = (os.totalmem() / 1024 / 1024).toFixed(2);

            const uptimeText = formatUptime(botUptime);

            const text = `
🧠 *SILVA MD — SYSTEM STATUS*

⏳ *Uptime*
${uptimeText}

⚡ *Latency:* ${latency} ms
🖥️ *CPU:* ${cpuModel}
🔩 *Cores:* ${cores}
💾 *RAM:* ${usedMem} / ${totalMem} MB

😎 Still standing. No coffee needed.
`.trim();

            await sock.sendMessage(jid, {
                text,
                contextInfo: {
                    mentionedJid: [sender],
                    forwardingScore: 999,
                    isForwarded: true,
                    externalAdReply: {
                        title: "SILVA MD SYSTEM CORE",
                        body: "Pure WhatsApp Tech Vibe ⚙️",
                        sourceUrl: "https://silvatech.top",
                        showAdAttribution: true,
                        thumbnailUrl: "https://i.imgur.com/8hQvY5j.png"
                    },
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: "120363200367779016@newsletter",
                        newsletterName: "SILVA MD RUNTIME ⏱️",
                        serverMessageId: 143
                    }
                }
            }, { quoted: message });

        } catch (err) {
            await sock.sendMessage(jid, {
                text: `❌ *Runtime Error*\n${err.message}`,
                contextInfo: {
                    mentionedJid: [message.key.participant || message.key.remoteJid],
                    forwardingScore: 999,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: "120363200367779016@newsletter",
                        newsletterName: "SILVA MD ERROR 💥",
                        serverMessageId: 143
                    }
                }
            }, { quoted: message });
        }
    }
};

module.exports = { handler };

// ────────────────
// Helpers
// ────────────────
function formatUptime(ms) {
    let d = Math.floor(ms / 86400000);
    let h = Math.floor(ms / 3600000) % 24;
    let m = Math.floor(ms / 60000) % 60;
    let s = Math.floor(ms / 1000) % 60;
    return `🗓️ ${d}d ${h}h ${m}m ${s}s`;
}

'use strict';
const axios = require('axios');
const os = require('os');

function detectPlatform() {
    if (process.env.PLATFORM) return process.env.PLATFORM;
    if (process.env.HEROKU_APP_NAME || process.env.DYNO) return 'Heroku';
    if (process.env.RAILWAY_ENVIRONMENT || process.env.RAILWAY_SERVICE_NAME) return 'Railway';
    if (process.env.RENDER) return 'Render';
    if (process.env.FLY_APP_NAME) return 'Fly.io';
    if (process.env.KOYEB_SERVICE_NAME) return 'Koyeb';
    if (process.env.REPL_ID || process.env.REPLIT_DB_URL) return 'Replit';
    return os.type() + ' Server';
}

module.exports = {
    commands:    ['speedtest', 'ping2', 'netspeed'],
    description: 'Test the bot server internet speed',
    permission:  'public',
    group:       true,
    private:     true,
    run: async (sock, message, args, { sender, groupId, contextInfo }) => {
        const chatId = groupId || sender;
        await sock.sendMessage(chatId, { text: '⏳ Testing internet speed...', contextInfo }, { quoted: message });
        try {
            const testUrl    = 'https://speed.cloudflare.com/__down?bytes=10000000';
            const start      = Date.now();
            const { data }   = await axios.get(testUrl, { responseType: 'arraybuffer', timeout: 30000 });
            const elapsed    = (Date.now() - start) / 1000;
            const bytes      = data.byteLength;
            const mbps       = ((bytes * 8) / elapsed / 1000000).toFixed(2);
            const latStart   = Date.now();
            await axios.head('https://1.1.1.1', { timeout: 5000 });
            const latency    = Date.now() - latStart;
            await sock.sendMessage(chatId, {
                text:
`🌐 *Server Speed Test*

⬇️ *Download:* ${mbps} Mbps
⚡ *Latency:*   ${latency}ms
📦 *Data:*      ${(bytes / 1024 / 1024).toFixed(2)} MB in ${elapsed.toFixed(2)}s
🖥️ *Server:*   ${detectPlatform()} (${process.platform})

_Powered by Cloudflare • Silva MD_`,
                contextInfo
            }, { quoted: message });
        } catch (e) {
            await sock.sendMessage(chatId, { text: `❌ Speed test failed: ${e.message}`, contextInfo }, { quoted: message });
        }
    }
};

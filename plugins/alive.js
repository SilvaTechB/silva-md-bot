const config = require('../config.js');

module.exports = async (sock, m, prefix, globalContextInfo) => {
    try {
        const body = m.message?.conversation || m.message?.extendedTextMessage?.text || '';
        const cmd = body.startsWith(prefix) ? body.slice(prefix.length).trim().split(/\s+/)[0].toLowerCase() : '';

        if (cmd === 'alive') {
            await sock.sendMessage(m.key.remoteJid, {
                image: { url: config.ALIVE_IMG },
                caption: `${config.LIVE_MSG}\n\n*Bot Name:* ${config.BOT_NAME}\n*Owner:* ${config.OWNER_NAME}`,
                contextInfo: globalContextInfo
            }, { quoted: m });
        }
    } catch (err) {
        console.error('❌ Alive Plugin Error:', err);
    }
};

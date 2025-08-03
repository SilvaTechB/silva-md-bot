module.exports = async (sock, globalContextInfo, config) => {
    sock.ev.on('messages.upsert', async ({ messages }) => {
        const m = messages[0];
        if (!m.message) return;
        
        const text = m.message.conversation || m.message.extendedTextMessage?.text || '';
        if (!text.startsWith(config.PREFIX)) return;
        
        const cmd = text.slice(config.PREFIX.length).trim().split(/\s+/)[0].toLowerCase();
        
        if (cmd === 'alive') {
            await sock.sendMessage(m.key.remoteJid, {
                image: { url: config.ALIVE_IMG },
                caption: config.LIVE_MSG,
                contextInfo: globalContextInfo
            }, { quoted: m });
        }
    });
};

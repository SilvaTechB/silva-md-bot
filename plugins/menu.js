module.exports = async (sock, globalContextInfo, config) => {
    sock.ev.on('messages.upsert', async ({ messages }) => {
        const m = messages[0];
        if (!m.message) return;
        
        const text = m.message.conversation || m.message.extendedTextMessage?.text || '';
        if (!text.startsWith(config.PREFIX)) return;
        
        const cmd = text.slice(config.PREFIX.length).trim().split(/\s+/)[0].toLowerCase();
        
        if (cmd === 'menu') {
            const menuMsg = `*${config.BOT_NAME} MENU*\n\n` +
            `1. ${config.PREFIX}ping - Check bot status\n` +
            `2. ${config.PREFIX}alive - Show alive status\n` +
            `3. ${config.PREFIX}sticker - Convert image/video to sticker\n\n` +
            `⚡ Powered by Silva Tech Inc.`;

            await sock.sendMessage(m.key.remoteJid, {
                image: { url: config.ALIVE_IMG },
                caption: menuMsg,
                contextInfo: globalContextInfo
            }, { quoted: m });
        }
    });
};

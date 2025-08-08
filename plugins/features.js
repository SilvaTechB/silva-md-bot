const moment = require('moment-timezone');

module.exports = {
    name: 'feature',
    commands: ['feature', 'totalfeature'],
    handler: async ({ sock, m, sender, contextInfo, plugins }) => {
        try {
            const who = m.mentionedJid && m.mentionedJid[0] ? m.mentionedJid[0] : 
                       m.fromMe ? sock.user.id : sender;
            const name = await sock.getName(who);
            
            // Get all registered commands from plugins
            const totalf = Object.values(plugins)
                .filter(plugin => plugin.commands && Array.isArray(plugin.commands))
                .reduce((acc, plugin) => acc + plugin.commands.length, 0);
            
            let txt = `*✧ BOT FEATURES ✧*\n\n`;
            txt += `◦  *Total Commands* : ${totalf}\n`;
            txt += `◦  *Requested By* : ${name}\n\n`;
            txt += `⚡ Powered by Silva MD`;
            
            await sock.sendMessage(m.chat, {
                text: txt,
                contextInfo: {
                    ...contextInfo,
                    mentionedJid: [sender],
                    externalAdReply: {
                        title: "Bot Features",
                        body: `${totalf} commands available`,
                        thumbnailUrl: "https://files.catbox.moe/5uli5p.jpeg",
                        sourceUrl: "https://github.com/SilvaTechB/silva-md-bot",
                        mediaType: 1,
                        showAdAttribution: true,
                        renderLargerThumbnail: true
                    }
                }
            }, { quoted: m });

        } catch (error) {
            console.error('Feature Count Error:', error);
            await sock.sendMessage(m.chat, {
                text: '⚠️ Failed to count features. The bot might be updating commands.',
                contextInfo: contextInfo
            }, { quoted: m });
        }
    }
};

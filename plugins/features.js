const moment = require('moment-timezone');

module.exports = {
    name: 'feature',
    commands: ['feature', 'totalfeature'],
    handler: async ({ sock, m, sender, contextInfo, plugins }) => {
        try {
            const who = m.mentionedJid && m.mentionedJid[0] ? m.mentionedJid[0] : 
                       m.fromMe ? sock.user.id : sender;
            const name = await sock.getName(who);
            const totalf = Object.values(plugins).filter(v => v.help && v.tags).length;
            
            let txt = `*乂  B O T  -  F E A T U R E*\n\n`;
            txt += `	◦  *Total* : ${totalf}\n`;
            txt += `*⚡ Powered by Silva MD*`;
            
            await sock.sendMessage(m.chat, {
                text: txt,
                contextInfo: {
                    ...contextInfo,
                    mentionedJid: [sender],
                    externalAdReply: {
                        title: "Bot Features",
                        body: `Total ${totalf} features available`,
                        thumbnailUrl: "https://files.catbox.moe/5uli5p.jpeg",
                        sourceUrl: "https://github.com/SilvaTechB/silva-md-bot",
                        mediaType: 1,
                        showAdAttribution: true,
                        renderLargerThumbnail: true
                    }
                }
            }, { quoted: m });

        } catch (error) {
            console.error('❌ Feature Plugin Error:', error);
            await sock.sendMessage(sender, {
                text: '❌ Failed to fetch feature count. Please try again later.',
                contextInfo: contextInfo
            }, { quoted: m });
        }
    }
};

const moment = require('moment-timezone');

module.exports = {
    name: 'feature',
    commands: ['feature', 'totalfeature'],
    handler: async ({ sock, m, sender, contextInfo, plugins }) => {
        try {
            // Safely get user information
            const who = m.mentionedJid?.[0] || sender;
            let name;
            try {
                name = await sock.getName(who);
            } catch {
                name = 'User';
            }

            // Safely count commands
            let totalf = 0;
            if (plugins && typeof plugins === 'object') {
                totalf = Object.values(plugins)
                    .filter(plugin => plugin?.commands?.length)
                    .reduce((acc, plugin) => acc + plugin.commands.length, 0);
            }

            const txt = `*✧ BOT FEATURES ✧*\n\n`
                      + `◦  *Total Commands* : ${totalf}\n`
                      + `◦  *Requested By* : ${name}\n\n`
                      + `⚡ Powered by Silva MD`;

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
                text: '⚠️ Failed to count features. Please try again later.',
                contextInfo: contextInfo
            }, { quoted: m });
        }
    }
};

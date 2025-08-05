module.exports = {
    name: 'test',
    commands: ['test', 'botdemo', 'features'],
    handler: async ({ sock, m, sender, contextInfo, isGroup }) => {
        // Define prefix first
        const prefix = global.config?.PREFIX || '!';
        
        try {
            // 1. First try sending as interactive buttons
            try {
                const botJid = sock.user.id;
                const botName = global.config?.BOT_NAME || 'Silva MD';
                const botPp = await sock.profilePictureUrl(botJid, 'image').catch(() => null);
                
                await sock.sendMessage(
                    sender,
                    {
                        [botPp ? 'image' : 'text']: botPp ? { url: botPp } : `🛠️ *${botName} Feature Testing Center* 🛠️`,
                        caption: `⚡ Test all bot capabilities\n` +
                                 `🔧 Select a category below to explore features`,
                        footer: `Silva Tech Inc • ${new Date().toLocaleString()}`,
                        buttons: [
                            { buttonId: `${prefix}test core`, buttonText: { displayText: '⚙️ Core' }, type: 1 },
                            { buttonId: `${prefix}test media`, buttonText: { displayText: '🎭 Media' }, type: 1 },
                            { buttonId: `${prefix}test fun`, buttonText: { displayText: '🎲 Fun' }, type: 1 },
                            { buttonId: `${prefix}test utils`, buttonText: { displayText: '🧰 Utilities' }, type: 1 }
                        ],
                        contextInfo: {
                            ...contextInfo,
                            externalAdReply: {
                                title: `${botName} Test Center`,
                                body: "Explore bot features",
                                thumbnailUrl: botPp || "https://files.catbox.moe/5uli5p.jpeg",
                                mediaType: 1
                            }
                        }
                    },
                    { quoted: m }
                );
                return;
            } catch (buttonError) {
                console.log('Button message failed, falling back to text menu:', buttonError);
            }

            // 2. Fallback to text menu if buttons fail
            const textMenu = `
🛠️ *SILVA MD TEST MENU* 🛠️

⚙️ *Core Features*
• ${prefix}ping - Test response time
• ${prefix}menu - Command list
• ${prefix}alive - Bot status check

🎭 *Media Tools*
• ${prefix}sticker - Create stickers
• ${prefix}toimg - Convert stickers
• ${prefix}mp3 - Audio tools

🎲 *Fun Modules*
• ${prefix}quote - Random quotes
• ${prefix}joke - Tell a joke
• ${prefix}game - Play games

🧰 *Utilities*
• ${prefix}calc - Calculator
• ${prefix}weather - Weather info
• ${prefix}translate - Language translator

Type the commands directly to test.
            `;

            await sock.sendMessage(
                sender,
                {
                    text: textMenu,
                    contextInfo: contextInfo
                },
                { quoted: m }
            );

        } catch (error) {
            console.error('Test Plugin Error:', error);
            // Final fallback to simple error message
            await sock.sendMessage(
                sender,
                {
                    text: '⚠️ Test system unavailable right now. Try these commands directly:\n' +
                          `${prefix}ping\n${prefix}menu\n${prefix}sticker`,
                    contextInfo: contextInfo
                },
                { quoted: m }
            );
        }
    }
};

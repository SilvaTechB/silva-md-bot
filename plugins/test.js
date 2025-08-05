// plugins/test.js
module.exports = {
    name: 'test',
    commands: ['test', 'botdemo', 'features'],
    handler: async ({ sock, m, sender, contextInfo, isGroup }) => {
        try {
            // Get bot info
            const botJid = sock.user.id;
            const botName = global.config?.BOT_NAME || 'Silva MD';
            const botPp = await sock.profilePictureUrl(botJid, 'image').catch(() => 
                'https://files.catbox.moe/5uli5p.jpeg'
            );

            // Main test menu with buttons
            await sock.sendMessage(
                sender,
                {
                    image: { url: botPp },
                    caption: `🛠️ *${botName} Feature Testing Center* 🛠️\n\n` +
                             `⚡ Test all bot capabilities through interactive buttons\n` +
                             `🔧 Select a category below to explore features`,
                    footer: `Silva Tech Inc • ${new Date().toLocaleString()}`,
                    buttons: [
                        { buttonId: `${prefix}test core`, buttonText: { displayText: '⚙️ Core Features' }, type: 1 },
                        { buttonId: `${prefix}test media`, buttonText: { displayText: '🎭 Media Tools' }, type: 1 },
                        { buttonId: `${prefix}test fun`, buttonText: { displayText: '🎲 Fun Modules' }, type: 1 },
                        { buttonId: `${prefix}test utils`, buttonText: { displayText: '🧰 Utilities' }, type: 1 }
                    ],
                    contextInfo: {
                        ...contextInfo,
                        externalAdReply: {
                            title: `${botName} Test Center`,
                            body: "Explore all bot features",
                            thumbnailUrl: botPp,
                            sourceUrl: "https://github.com/SilvaTechB/silva-md-bot",
                            mediaType: 1,
                            renderLargerThumbnail: true
                        }
                    }
                },
                { quoted: m }
            );

        } catch (error) {
            console.error('Test Plugin Error:', error);
            await sock.sendMessage(
                sender,
                {
                    text: '❌ Failed to load test menu. Please try again later.',
                    contextInfo: contextInfo
                },
                { quoted: m }
            );
        }
    }
};

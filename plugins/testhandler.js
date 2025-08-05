// plugins/testhandler.js
module.exports = {
    name: 'testhandler',
    commands: ['test core', 'test media', 'test fun', 'test utils'],
    handler: async ({ sock, m, sender, args, contextInfo, isGroup }) => {
        try {
            const testType = m.text.split(' ')[1];
            const botPp = await sock.profilePictureUrl(sock.user.id, 'image').catch(() => 
                'https://files.catbox.moe/5uli5p.jpeg'
            );

            switch(testType) {
                case 'core':
                    await sock.sendMessage(
                        sender,
                        {
                            text: `⚙️ *Core Features Testing* ⚙️\n\n` +
                                  `These are essential bot functions:\n\n` +
                                  `• Bot Status • Commands • Settings • More`,
                            footer: `Select a feature to test`,
                            buttons: [
                                { buttonId: `${prefix}ping`, buttonText: { displayText: '🏓 Ping Test' }, type: 1 },
                                { buttonId: `${prefix}menu`, buttonText: { displayText: '📋 Command List' }, type: 1 },
                                { buttonId: `${prefix}alive`, buttonText: { displayText: '💚 Status Check' }, type: 1 },
                                { buttonId: `${prefix}speed`, buttonText: { displayText: '⚡ Speed Test' }, type: 1 }
                            ],
                            contextInfo: contextInfo
                        },
                        { quoted: m }
                    );
                    break;

                case 'media':
                    await sock.sendMessage(
                        sender,
                        {
                            text: `🎨 *Media Tools Testing* 🎨\n\n` +
                                  `Test all media handling capabilities:\n\n` +
                                  `• Images • Videos • Documents • Stickers`,
                            footer: `Select a media type to test`,
                            buttons: [
                                { buttonId: `${prefix}sticker`, buttonText: { displayText: '🖼️ Create Sticker' }, type: 1 },
                                { buttonId: `${prefix}toimg`, buttonText: { displayText: '📸 Sticker to Image' }, type: 1 },
                                { buttonId: `${prefix}mp3`, buttonText: { displayText: '🎵 Audio Tools' }, type: 1 },
                                { buttonId: `${prefix}enhance`, buttonText: { displayText: '✨ Enhance Image' }, type: 1 }
                            ],
                            contextInfo: contextInfo
                        },
                        { quoted: m }
                    );
                    break;

                case 'fun':
                    await sock.sendMessage(
                        sender,
                        {
                            image: { url: botPp },
                            caption: `🎉 *Fun Modules Testing* 🎉\n\n` +
                                     `Explore entertaining features:\n\n` +
                                     `• Games • Quotes • Jokes • AI Chat`,
                            footer: `What would you like to try?`,
                            buttons: [
                                { buttonId: `${prefix}quote`, buttonText: { displayText: '📜 Random Quote' }, type: 1 },
                                { buttonId: `${prefix}joke`, buttonText: { displayText: '😂 Tell a Joke' }, type: 1 },
                                { buttonId: `${prefix}ai`, buttonText: { displayText: '🤖 Chat with AI' }, type: 1 },
                                { buttonId: `${prefix}game`, buttonText: { displayText: '🎮 Play Game' }, type: 1 }
                            ],
                            contextInfo: contextInfo
                        },
                        { quoted: m }
                    );
                    break;

                case 'utils':
                    await sock.sendMessage(
                        sender,
                        {
                            text: `🧰 *Utility Tools Testing* 🧰\n\n` +
                                  `Practical everyday tools:\n\n` +
                                  `• Downloaders • Converters • Calculators • More`,
                            footer: `Select a utility to test`,
                            buttons: [
                                { buttonId: `${prefix}calc 2+2`, buttonText: { displayText: '🧮 Calculator' }, type: 1 },
                                { buttonId: `${prefix}weather Nairobi`, buttonText: { displayText: '⛅ Weather' }, type: 1 },
                                { buttonId: `${prefix}translate hello to swahili`, buttonText: { displayText: '🌍 Translator' }, type: 1 },
                                { buttonId: `${prefix}gitclone`, buttonText: { displayText: '📥 GitHub Download' }, type: 1 }
                            ],
                            contextInfo: contextInfo
                        },
                        { quoted: m }
                    );
                    break;

                default:
                    await sock.sendMessage(
                        sender,
                        {
                            text: '⚠️ Invalid test category. Use .test to see available options',
                            contextInfo: contextInfo
                        },
                        { quoted: m }
                    );
            }
        } catch (error) {
            console.error('TestHandler Error:', error);
            await sock.sendMessage(
                sender,
                {
                    text: '❌ Failed to process test request. Please try again.',
                    contextInfo: contextInfo
                },
                { quoted: m }
            );
        }
    }
};

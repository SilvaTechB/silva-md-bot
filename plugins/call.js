const { generateWAMessageFromContent } = require('@whiskeysockets/baileys');

module.exports = {
    name: 'support',
    commands: ['call', 'support', 'ss'],
    tags: ['main'],
    description: 'Silva MD support panel with Nairobi time',
    handler: async ({ sock, m, sender, contextInfo }) => {
        try {
            // Nairobi time formatting
            const timeOptions = {
                hour: 'numeric',
                minute: 'numeric',
                hour12: true,
                timeZone: 'Africa/Nairobi'
            };
            const dateOptions = { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric', 
                timeZone: 'Africa/Nairobi'
            };
            
            const nairobiTime = new Date().toLocaleTimeString('en-KE', timeOptions);
            const nairobiDate = new Date().toLocaleDateString('en-KE', dateOptions);

            // Main message structure
            const message = {
                text: `『 *Silva MD Bot* 』\n© 2025 *Silvatech Inc*\n\n⏰ *${nairobiTime}*\n📅 *${nairobiDate}*`,
                footer: "Swipe left/right for options ▼",
                title: "SILVA SUPPORT PANEL",
                buttonText: "OPEN MENU",
                sections: [
                    {
                        title: "CONTACT OPTIONS",
                        rows: [
                            {
                                title: "📞 Voice Call",
                                description: "Instant voice support",
                                rowId: "#call"
                            },
                            {
                                title: "💬 Live Chat",
                                description: "Chat with an agent",
                                rowId: "#chat"
                            }
                        ]
                    },
                    {
                        title: "TECHNICAL SUPPORT",
                        rows: [
                            {
                                title: "🛠️ System Status",
                                description: "Check server health",
                                rowId: "#status"
                            },
                            {
                                title: "🔧 Troubleshooting",
                                description: "Common fixes guide",
                                rowId: "#help"
                            }
                        ]
                    }
                ],
                buttons: [
                    {
                        buttonId: '#contact',
                        buttonText: { displayText: "📲 CALL NOW" },
                        type: 1
                    }
                ]
            };

            // Send as interactive message
            await sock.sendMessage(
                sender,
                {
                    text: message.text,
                    footer: message.footer,
                    buttons: message.buttons,
                    sections: message.sections,
                    title: message.title,
                    buttonText: message.buttonText,
                    mentions: [m.sender],
                    contextInfo: {
                        ...contextInfo,
                        externalAdReply: {
                            title: "Silva Support",
                            body: "Available 24/7",
                            thumbnailUrl: "https://files.catbox.moe/5uli5p.jpeg",
                            mediaType: 1
                        }
                    }
                },
                { quoted: m }
            );

        } catch (error) {
            console.error('Support Panel Error:', error);
            const nairobiTime = new Date().toLocaleTimeString('en-KE', { 
                hour: 'numeric', 
                minute: 'numeric', 
                hour12: true, 
                timeZone: 'Africa/Nairobi' 
            });
            
            await sock.sendMessage(
                sender,
                { 
                    text: `⚠️ Failed to load menu. Direct contact:\nhttps://wa.me/254700143167\n\nCurrent Nairobi Time: ${nairobiTime}`,
                    contextInfo: contextInfo
                },
                { quoted: m }
            );
        }
    }
};

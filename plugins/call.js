const { generateWAMessageFromContent } = require('@whiskeysockets/baileys');
const os = require('os');
const process = require('process');

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
            const sentMsg = await sock.sendMessage(
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

            // Handle button selections
            sock.ev.on('messages.upsert', async ({ messages }) => {
                const response = messages[0];
                if (!response.message || response.key.remoteJid !== sender) return;

                const selected = response.message?.buttonsResponseMessage?.selectedButtonId || 
                               response.message?.listResponseMessage?.singleSelectReply?.selectedRowId;

                if (selected === '#call' || selected === '#contact') {
                    // Send vCard for voice call
                    await sock.sendMessage(
                        sender,
                        {
                            contacts: {
                                displayName: "Silva Support",
                                contacts: [{
                                    displayName: "Silva Tech Support",
                                    vcard: `BEGIN:VCARD\nVERSION:3.0\nFN:Silva Tech Support\nTEL;type=CELL;type=VOICE;waid=254700143167:+254 700 143167\nEND:VCARD`
                                }]
                            }
                        },
                        { quoted: m }
                    );
                } 
                else if (selected === '#chat') {
                    // Send social media links
                    await sock.sendMessage(
                        sender,
                        {
                            text: `📱 *Social Media Links*\n\n` +
                                  `• Facebook: https://web.facebook.com/silva.tech.inc\n` +
                                  `• Instagram: https://instagram.com/silva.tech.inc\n` +
                                  `• TikTok: https://www.tiktok.com/@silva.tech.inc\n` +
                                  `• X (Twitter): https://x.com/silva_african`,
                            contextInfo: contextInfo
                        },
                        { quoted: m }
                    );
                }
                else if (selected === '#status') {
                    // Show system status
                    const uptime = process.uptime();
                    const hours = Math.floor(uptime / 3600);
                    const minutes = Math.floor((uptime % 3600) / 60);
                    const seconds = Math.floor(uptime % 60);
                    
                    await sock.sendMessage(
                        sender,
                        {
                            text: `🖥️ *System Status*\n\n` +
                                  `• Uptime: ${hours}h ${minutes}m ${seconds}s\n` +
                                  `• Platform: ${os.platform()} ${os.arch()}\n` +
                                  `• Memory: ${(os.freemem() / 1024 / 1024).toFixed(2)}MB free of ${(os.totalmem() / 1024 / 1024).toFixed(2)}MB\n` +
                                  `• CPU: ${os.cpus()[0].model}`,
                            contextInfo: contextInfo
                        },
                        { quoted: m }
                    );
                }
                else if (selected === '#help') {
                    // Send troubleshooting contacts
                    await sock.sendMessage(
                        sender,
                        {
                            contacts: {
                                displayName: "Troubleshooting Contacts",
                                contacts: [
                                    {
                                        displayName: "Silva Tech Support 1",
                                        vcard: `BEGIN:VCARD\nVERSION:3.0\nFN:Tech Support 1\nTEL;type=CELL;type=VOICE;waid=254755257907:+254 755 257907\nEND:VCARD`
                                    },
                                    {
                                        displayName: "Silva Tech Support 2",
                                        vcard: `BEGIN:VCARD\nVERSION:3.0\nFN:Tech Support 2\nTEL;type=CELL;type=VOICE;waid=254743706010:+254 755 257907\nEND:VCARD`
                                    }
                                ]
                            }
                        },
                        { quoted: m }
                    );
                }
            });

            // Remove listener after 5 minutes
            setTimeout(() => {
                sock.ev.off('messages.upsert', this.listener);
            }, 300000);

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

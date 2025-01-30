
import pkg from '@whiskeysockets/baileys';
import moment from 'moment-timezone';

const { generateWAMessageFromContent } = pkg;

let handler = async (m, { conn }) => {
    try {
        // Nairobi time formatting
        const nairobiTime = moment().tz('Africa/Nairobi').format('h:mm A');
        const nairobiDate = moment().tz('Africa/Nairobi').format('dddd, MMMM D, YYYY');

        // Create carousel with swipeable cards
        const message = {
            text: `『 *Silva MD Bot* 』\n© 2025 *Silvatech Inc*`,
            footer: `📅 ${nairobiDate} | ⏰ ${nairobiTime}`,
            title: "TECH SUPPORT CARDS",
            buttonText: "VIEW CARDS",
            sections: [
                {
                    title: "CONTACT CARD",
                    rows: [
                        {
                            title: "📞 Immediate Support",
                            description: "24/7 Technical Assistance",
                            rowId: ".call",
                        },
                        {
                            title: "🛠️ System Status",
                            description: "Check server operational status",
                            rowId: ".status"
                        }
                    ]
                },
                {
                    title: "SUPPORT OPTIONS",
                    rows: [
                        {
                            title: "💬 Live Chat",
                            description: "Chat with support agent",
                            rowId: ".chat"
                        },
                        {
                            title: "📩 Email Support",
                            description: "support@silvatech.co.ke",
                            rowId: ".email"
                        }
                    ]
                }
            ],
            templateButtons: [
                {
                    urlButton: {
                        displayText: "📲 Call Now",
                        url: "https://wa.me/254700143167?text=Hello%20Silva%20Tech%20Support!"
                    }
                },
                {
                    quickReplyButton: {
                        displayText: "🏠 Main Menu",
                        id: "!menu"
                    }
                }
            ]
        };

        // Send as interactive carousel
        await conn.sendMessage(m.chat, {
            text: message.text,
            footer: message.footer,
            templateButtons: message.templateButtons,
            sections: message.sections,
            title: message.title,
            buttonText: message.buttonText,
            viewOnce: true
        });

    } catch (error) {
        console.error("Error generating carousel:", error);
        await conn.sendMessage(m.chat, { 
            text: `⚠️ Error loading interface. Direct contact: https://wa.me/254700143167\n${nairobiTime} | ${nairobiDate}`
        });
    }
};

handler.help = ["support", "help", "contact"];
handler.tags = ["utility"];
handler.command = ["call", "piga", "contact", "cards"];

export default handler;

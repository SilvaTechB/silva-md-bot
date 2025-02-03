// handler.js
import pkg from '@whiskeysockets/baileys';

const { generateWAMessageFromContent, prepareWAMessageMedia } = pkg;

let handler = async (m, { conn }) => {
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

        // Prepare image media
        const media = await prepareWAMessageMedia({ image: { url: 'https://i.imgur.com/lvJhrMy.jpeg' } }, { upload: conn.waUploadToServer });

        // Main message structure
        const message = {
            text: `『 *Silva MD Bot* 』\n© 2025 *Silvatech Inc*\n\n⏰ *${nairobiTime}*\n📅 *${nairobiDate}*\n\n🎨 *LEVEL UP YOUR CAMPAIGN WITH SILVA TECH DESIGNS!* 🗳✨\n\nRunning for *MMUSO Elections 2025*? Let your posters do the talking! 🚀 Whether you need bold, creative, or professional designs, I’ve got you covered.\n\n✅ Custom Poster Designs\n✅ Eye-Catching Graphics\n✅ Fast Turnaround & Affordable Rates\n\nStand out from the crowd and make your campaign unforgettable! 💥\n\n📲 *Let’s Chat on WhatsApp:* 254700143167\n🌐 *Check Out My Work:* https://silvatechinc.my.id\n\n*Get noticed. Get elected.* 🎯`,
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
            ],
            headerType: 4,
            image: media.image
        };

        // Send as interactive list message
        await conn.sendMessage(m.chat, message, { quoted: m });

    } catch (error) {
        console.error("Error:", error);
        await conn.sendMessage(m.chat, { 
            text: `⚠️ Failed to load menu. Direct contact:\nhttps://wa.me/254700143167\n\nCurrent Nairobi Time: ${nairobiTime}`
        });
    }
};

handler.help = ["support"];
handler.tags = ["main"];
handler.command = ["c", "cr", "sss"];

export default handler;

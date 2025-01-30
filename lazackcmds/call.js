// handler.js
import pkg from '@whiskeysockets/baileys';

const { generateWAMessageFromContent } = pkg;

let handler = async (m, { conn }) => {
    try {
        // Date/time configuration
        const now = new Date();
        const options = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric', 
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
            timeZone: 'Africa/Nairobi'
        };
        
        const formattedDate = now.toLocaleDateString('en-KE', options);
        const [dayName, dateString, timeString] = formattedDate.split(/\s*,\s*/);

        // Message content
        const menuText = `
『 *Silva MD Bot* 』
© 2025 *Silvatech Inc*

📅 *${dayName}, ${dateString}*
⏰ *${timeString}*

Need immediate assistance? Click below to contact support`;

        // Create interactive message
        const message = {
            text: menuText,
            footer: "Silva Tech Support - 24/7 Service",
            buttons: [
                {
                    type: 'url',
                    title: '📞 Call Support Now',
                    payload: 'https://wa.me/254700143167?text=Hello%20Silva%20Tech%20Support!'
                }
            ],
            headerType: 1
        };

        // Send message with working button
        await conn.sendMessage(m.chat, {
            text: message.text,
            footer: message.footer,
            templateButtons: [
                {
                    index: 1,
                    urlButton: {
                        displayText: '📞 Contact Support',
                        url: 'https://wa.me/254700143167?text=Hello%20Silva%20Tech%20Support!'
                    }
                }
            ]
        });
        
    } catch (error) {
        console.error("Error generating message:", error);
        await conn.sendMessage(m.chat, { 
            text: "⚠️ Failed to load button. Please contact support directly: https://wa.me/254700143167"
        });
    }
};

handler.help = ["support", "help", "contact"];
handler.tags = ["utility"];
handler.command = ["call", "piga", "contact"];

export default handler;

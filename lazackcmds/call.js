// handler.js
// URL button handler for Silva MD Bot

import pkg from '@whiskeysockets/baileys';
import moment from 'moment-timezone';

const { generateWAMessageFromContent } = pkg;

let handler = async (m, { conn }) => {
    try {
        // Initialize date and time variables
        const now = new Date(new Date().getTime() + 3600000);
        const locale = 'en';
        const fullDate = now.toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' });

        // Message content
        const menuText = `
『 *Silva MD Bot* 』
© 2025 *Silvatech Inc*

📆 *${fullDate}*

Need help? Contact Silva Tech Support by clicking the button below.`;

        // Define the message with a URL button
        const buttonMessage = {
            text: menuText,
            footer: "Silva Tech Support",
            templateButtons: [
                {
                    index: 1,
                    urlButton: {
                        displayText: "📞 Contact Support",
                        url: "https://wa.me/254700143167?text=Hello%20Silva%20Tech%20Support!",
                    },
                },
            ],
        };

        // Send the message
        await conn.sendMessage(m.chat, buttonMessage);
    } catch (error) {
        console.error("Error generating URL button message:", error);
        m.reply("An error occurred while generating the contact button.");
    }
};

handler.help = ["support", "help", "contact"];
handler.tags = ["utility"];
handler.command = ["call", "piga", "contact"];

export default handler;

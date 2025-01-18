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

        // Create the message with URL button
        const urlButtonMessage = {
            text: menuText,
            footer: "Silva Tech Support",
            buttons: [
                {
                    buttonId: "support_url",
                    buttonText: { displayText: "📞 Contact Support" },
                    type: 2, // URL button type
                    url: "https://wa.me/254700143167?text=Hello%20Silva%20Tech%20Support!", // WhatsApp link
                },
            ],
            headerType: 1, // Header type for text-based messages
        };

        // Send the message
        await conn.sendMessage(m.chat, urlButtonMessage);
    } catch (error) {
        console.error("Error generating URL button message:", error);
        m.reply("An error occurred while generating the contact button.");
    }
};

handler.help = ["call", "piga", "contact"];
handler.tags = ["utility"];
handler.command = ["call", "piga", "contact"];

export default handler;

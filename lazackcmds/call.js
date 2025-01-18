// handler.js
// Call button handler for Silva MD Bot

import pkg from '@whiskeysockets/baileys';
import moment from 'moment-timezone';

const { generateWAMessageFromContent } = pkg;

let handler = async (m, { conn }) => {
    try {
        // Initialize date and time variables
        const now = new Date(new Date().getTime() + 3600000);
        const locale = 'en';
        const fullDate = now.toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' });

        const sections = [
            {
                title: "Contact Options",
                rows: [
                    {
                        title: "📞 Contact Us",
                        description: "Reach out to Silva Tech Support.",
                        rowId: "call_support",
                    },
                ],
            },
        ];

        // Prepare list message content
        const listMessage = {
            text: `『 *Silva MD Bot* 』\n© 2025 *Silvatech Inc*\n\n📆 *${fullDate}*\n\nNeed help? Choose an option below to contact support.`,
            footer: "Choose an option:",
            title: "Contact Support",
            buttonText: "Contact Menu",
            sections,
        };

        // Send the list message
        await conn.sendMessage(m.chat, listMessage);

        // Handle the row selection (in a separate part of your script)
        conn.on("chat-update", async (chatUpdate) => {
            if (!chatUpdate.messages) return;

            const msg = chatUpdate.messages.all()[0];
            if (msg.message && msg.message.listResponseMessage) {
                const selectedRowId = msg.message.listResponseMessage.singleSelectReply.selectedRowId;

                if (selectedRowId === "call_support") {
                    // Respond with a direct call button
                    await conn.sendMessage(m.chat, {
                        text: "Click the button below to call us directly.",
                        buttons: [
                            {
                                buttonText: { displayText: "📞 Call Now" },
                                type: 6, // Call button type
                                phoneNumber: "+254700143167",
                            },
                        ],
                        footer: "Silva Tech Support",
                    });
                }
            }
        });
    } catch (error) {
        console.error("Error generating call button message:", error);
        m.reply("An error occurred while generating the contact menu.");
    }
};

handler.help = ["call", "contact"];
handler.tags = ["utility"];
handler.command = ["call", "contact"];

export default handler;

// callHandler.js
// Call button handler for Silva MD Bot

import pkg from '@whiskeysockets/baileys';

const { generateWAMessageFromContent } = pkg;

let handler = async (m, { conn }) => {
    try {
        // Message content with a call button
        const callMessage = generateWAMessageFromContent(
            m.chat,
            {
                templateMessage: {
                    hydratedTemplate: {
                        hydratedContentText: "📞 Need assistance? Contact us directly using the button below.",
                        hydratedFooterText: "Silva MD Bot © 2025 Silvatech Inc",
                        hydratedButtons: [
                            {
                                callButton: {
                                    displayText: "📞 Contact Us",
                                    phoneNumber: "+254700143167",
                                },
                            },
                        ],
                    },
                },
            },
            {}
        );

        // Send the generated message with the call button
        await conn.relayMessage(callMessage.key.remoteJid, callMessage.message, {
            messageId: callMessage.key.id,
        });
    } catch (error) {
        console.error("Error sending call button message:", error);
        m.reply("An error occurred while sending the contact button.");
    }
};

handler.help = ['call'];
handler.tags = ['utility'];
handler.command = ['call', 'contact'];

export default handler;

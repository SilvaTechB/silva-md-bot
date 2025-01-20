// handler.js
// Menu command handler for Silva MD Bot

import pkg from 'silva-baileys';
import moment from 'moment-timezone';
import { createHash } from 'crypto';
import { xpRange } from '../lib/levelling.js';

const { prepareWAMessageMedia, generateWAMessageFromContent } = pkg;

let handler = async (m, { conn, usedPrefix }) => {
    try {
        // Initialize date and time-related variables
        const now = new Date(new Date().getTime() + 3600000);
        const locale = 'en';
        const weekDay = now.toLocaleDateString(locale, { weekday: 'long' });
        const fullDate = now.toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' });
        const uptime = clockString(process.uptime() * 1000);

        const greeting = getGreeting();

        const menuText = `
『 *Silva MD Bot* 』
© 2025 *Silvatech Inc*

Welcome to the Silva MD Bot. Use the menu below to interact with the bot effectively.
*Today*: ${weekDay}, ${fullDate}
*Uptime*: ${uptime}

${greeting}`;

        // Prepare media for the message
        const media = await prepareWAMessageMedia(
            { image: { url: './media/shizo.jpg' } },
            { upload: conn.waUploadToServer }
        );

        // Create the menu message with interactive buttons
        const menuMessage = generateWAMessageFromContent(
            m.chat,
            {
                templateMessage: {
                    hydratedTemplate: {
                        hydratedContentText: menuText,
                        hydratedFooterText: "Use the buttons below:",
                        hydratedButtons: [
                            {
                                quickReplyButton: {
                                    displayText: "🎁 Bot Menu",
                                    id: `${usedPrefix}botmenu`,
                                },
                            },
                            {
                                quickReplyButton: {
                                    displayText: "🖲️ Owner Menu",
                                    id: `${usedPrefix}ownermenu`,
                                },
                            },
                            {
                                quickReplyButton: {
                                    displayText: "🎉 AI Menu",
                                    id: `${usedPrefix}aimenu`,
                                },
                            },
                            {
                                quickReplyButton: {
                                    displayText: "🎧 Audio Menu",
                                    id: `${usedPrefix}aeditor`,
                                },
                            },
                            {
                                quickReplyButton: {
                                    displayText: "🍫 Anime Menu",
                                    id: `${usedPrefix}animemenu`,
                                },
                            },
                            {
                                quickReplyButton: {
                                    displayText: "🛫 Group Menu",
                                    id: `${usedPrefix}groupmenu`,
                                },
                            },
                            {
                                quickReplyButton: {
                                    displayText: "💵 Economy Menu",
                                    id: `${usedPrefix}economymenu`,
                                },
                            },
                            {
                                quickReplyButton: {
                                    displayText: "🎭 Fun Menu",
                                    id: `${usedPrefix}funmenu`,
                                },
                            },
                            {
                                quickReplyButton: {
                                    displayText: "🗂️ Download Menu",
                                    id: `${usedPrefix}dlmenu`,
                                },
                            },
                            {
                                quickReplyButton: {
                                    displayText: "🎮 Game Menu",
                                    id: `${usedPrefix}gamemenu`,
                                },
                            },
                            {
                                quickReplyButton: {
                                    displayText: "🫐 Sticker Menu",
                                    id: `${usedPrefix}stickermenu`,
                                },
                            },
                            {
                                quickReplyButton: {
                                    displayText: "🏵️ Logo Menu",
                                    id: `${usedPrefix}logomenu`,
                                },
                            },
                            {
                                quickReplyButton: {
                                    displayText: "🌄 NSFW Menu",
                                    id: `${usedPrefix}nsfwmenu`,
                                },
                            },
                        ],
                        imageMessage: media.imageMessage,
                    },
                },
            },
            {}
        );

        // Send the generated menu message
        await conn.relayMessage(menuMessage.key.remoteJid, menuMessage.message, {
            messageId: menuMessage.key.id,
        });
    } catch (error) {
        console.error("Error generating menu:", error);
        m.reply("An error occurred while generating the menu.");
    }
};

handler.help = ['men2', 'hel2', 'h', 'commands2'];
handler.tags = ['group'];
handler.command = ['men2', 'hel2', 'h', 'command2'];

export default handler;

// Utility Functions

// Format uptime as HH:MM:SS
function clockString(ms) {
    const h = Math.floor(ms / 3600000) || 0;
    const m = Math.floor((ms % 3600000) / 60000) || 0;
    const s = Math.floor((ms % 60000) / 1000) || 0;
    return [h, m, s].map((unit) => unit.toString().padStart(2, '0')).join(':');
}

// Return a contextual greeting based on the current time
function getGreeting() {
    const hour = moment.tz('Asia/Karachi').hour();
    if (hour < 4) return "Happy early morning ☀️";
    if (hour < 10) return "Good morning 🌅";
    if (hour < 15) return "Good afternoon 🕑";
    if (hour < 18) return "Good evening 🌇";
    return "Good night 🌙";
}

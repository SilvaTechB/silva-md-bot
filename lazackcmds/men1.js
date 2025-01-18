// handler.js
// Menu command handler for Silva MD Bot

import pkg from '@whiskeysockets/baileys';
import moment from 'moment-timezone';
import { createHash } from 'crypto';
import { xpRange } from '../lib/levelling.js';

const { proto, prepareWAMessageMedia, generateWAMessageFromContent } = pkg;

let handler = async (m, { conn, usedPrefix }) => {
    try {
        // Initialize date and time-related variables
        const now = new Date(new Date().getTime() + 3600000); // Adjust timezone as needed
        const locale = 'en';
        const weekDay = now.toLocaleDateString(locale, { weekday: 'long' });
        const fullDate = now.toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' });
        const uptime = clockString(process.uptime() * 1000);

        // Determine the target user
        const target = m.quoted?.sender || m.mentionedJid?.[0] || (m.fromMe ? conn.user.jid : m.sender);

        if (!(target in global.db.data.users)) {
            throw '✳️ The user is not found in my database.';
        }

        const user = global.db.data.users[target];
        const { level } = user;
        const { min, xp, max } = xpRange(level, global.multiplier);
        const greeting = getGreeting();

        const menuText = `
『 *Silva MD Bot* 』  
© 2025 *Silvatech Inc*

Welcome to the Silva MD Bot. Use the menu below to interact with the bot effectively.`;

        // Prepare menu content with buttons
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
                        ],
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

handler.help = ['men1', 'hel1', 'commands1'];
handler.tags = ['group'];
handler.command = ['men1', 'hel1', 'commands1'];

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

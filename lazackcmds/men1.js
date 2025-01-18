// handler.js
// Menu command handler for Silva MD Bot

import pkg from '@whiskeysockets/baileys';
import moment from 'moment-timezone';
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

        const greeting = getGreeting();
        const menuText = `
『 *Silva MD Bot* 』  
© 2025 *Silvatech Inc*

Welcome to the Silva MD Bot. Use the menu below to interact with the bot effectively.`;

        // Create List Message
        const listMessage = {
            text: menuText,
            footer: "Powered by Silva MD Bot",
            title: "Main Menu",
            buttonText: "Open Menu",
            sections: [
                {
                    title: "Bot Features",
                    rows: [
                        { title: "🎁 Bot Menu", description: "View all available bot commands", rowId: `${usedPrefix}botmenu` },
                        { title: "🖲️ Owner Menu", description: "Manage bot settings and configurations", rowId: `${usedPrefix}ownermenu` },
                        { title: "🎉 AI Menu", description: "Interact with AI features", rowId: `${usedPrefix}aimenu` },
                        { title: "🎧 Audio Menu", description: "Audio editing commands", rowId: `${usedPrefix}aeditor` },
                        { title: "🍫 Anime Menu", description: "Anime-related commands", rowId: `${usedPrefix}animemenu` },
                    ],
                },
                {
                    title: "Contact Support",
                    rows: [
                        { title: "📞 Call Support", description: "Dial +254700143167 for assistance", rowId: `${usedPrefix}callSupport` },
                    ],
                },
            ],
        };

        // Send the List Message
        await conn.sendMessage(m.chat, listMessage);
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

// handler.js
// Menu command handler for Silva MD Bot

import pkg from 'silva-baileys';
import moment from 'moment-timezone';

const { proto, generateWAMessageFromContent } = pkg;

let handler = async (m, { conn, usedPrefix }) => {
    try {
        // Initialize date and time variables
        const now = new Date();
        const locale = 'en';
        const weekDay = now.toLocaleDateString(locale, { weekday: 'long' });
        const fullDate = now.toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' });
        const uptime = clockString(process.uptime() * 1000);

        // Dynamic greeting
        const greeting = getGreeting();

        // Menu text
        const menuText = `『 *Silva MD Bot* 』  
© 2025 *Silvatech Inc*

Welcome to the Silva MD Bot. Use the menu below to interact with the bot effectively.

**Today**: ${weekDay}, ${fullDate}  
**Uptime**: ${uptime}  
${greeting}`;

        // Prepare interactive message
        const sections = [
            {
                title: "Here are the menu options:",
                rows: [
                    { title: "🎁 Bot Menu", description: "Control panel for the bot.", rowId: `${usedPrefix}botmenu` },
                    { title: "🖲️ Owner Menu", description: "Admin options for the bot.", rowId: `${usedPrefix}ownermenu` },
                    { title: "🎉 AI Menu", description: "Your AI assistants.", rowId: `${usedPrefix}aimenu` },
                    { title: "🎧 Audio Menu", description: "Audio customization tools.", rowId: `${usedPrefix}aeditor` },
                    { title: "🍫 Anime Menu", description: "Anime stickers, images, and videos.", rowId: `${usedPrefix}animemenu` },
                    { title: "🛫 Group Menu", description: "Tools for managing groups.", rowId: `${usedPrefix}groupmenu` },
                    { title: "💵 Economy Menu", description: "Virtual economy management.", rowId: `${usedPrefix}economymenu` },
                    { title: "🎭 Fun Menu", description: "Games, jokes, and fun!", rowId: `${usedPrefix}funmenu` },
                    { title: "🗂️ Download Menu", description: "Downloading tools.", rowId: `${usedPrefix}dlmenu` },
                    { title: "🎮 Game Menu", description: "Enter the game zone.", rowId: `${usedPrefix}gamemenu` },
                    { title: "🫐 Sticker Menu", description: "Sticker creation tools.", rowId: `${usedPrefix}stickermenu` },
                    { title: "🏵️ Logo Menu", description: "Logo creation tools.", rowId: `${usedPrefix}logomenu` },
                    { title: "🌄 NSFW Menu", description: "After dark content.", rowId: `${usedPrefix}nsfwmenu` },
                ],
            },
        ];

        const listMessage = {
            text: menuText,
            footer: "Use the options below to navigate.",
            title: "Silva MD Bot Menu",
            buttonText: "Open Menu",
            sections,
        };

        // Send the list message
        await conn.sendMessage(m.chat, listMessage, { quoted: m });
    } catch (error) {
        console.error("Error generating menu:", error);
        m.reply("An error occurred while generating the menu.");
    }
};

handler.help = ['menu', 'help', 'commands'];
handler.tags = ['main'];
handler.command = ['men2', 'hel2', 'commands2'];

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

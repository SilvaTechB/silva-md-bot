const fs = require('fs');
const path = require('path');
const express = require('express');
const { Boom } = require('@hapi/boom');
const pino = require('pino');
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const config = require('./config');

// Global forwarding info
const globalContextInfo = {
    forwardingScore: 999,
    isForwarded: true,
    forwardedNewsletterMessageInfo: {
        newsletterJid: '120363200367779016@newsletter',
        newsletterName: 'SILVA TECH',
        serverMessageId: 144
    },
    externalAdReply: {
        title: 'Silva MD Bot',
        body: 'Powered by Silva Tech Inc',
        thumbnailUrl: 'https://files.catbox.moe/5uli5p.jpeg',
        sourceUrl: 'https://github.com/SilvaTechB/silva-md-bot',
        mediaType: 1,
        renderLargerThumbnail: true
    }
};

const prefix = config.PREFIX || '.';
let commands = []; // To store all commands from plugins

// Start Express for Heroku
const app = express();
const PORT = process.env.PORT || 9090;
app.get('/', (req, res) => res.send('✅ Silva MD Bot is Running!'));
app.listen(PORT, () => console.log(`🌐 Server running on port ${PORT}`));

// Main connection function
async function connectToWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState('./session');
    const sock = makeWASocket({
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false,
        auth: state
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut);
            console.log('Connection closed. Reconnecting...', shouldReconnect);
            if (shouldReconnect) connectToWhatsApp();
        } else if (connection === 'open') {
            console.log('✅ Connected to WhatsApp');
            const pluginCount = await loadPlugins(sock);
            await sendWelcomeMessage(sock, pluginCount);
        }
    });

    sock.ev.on('messages.upsert', async ({ messages }) => {
        const m = messages[0];
        if (!m.message || m.key.fromMe) return;

        const text = m.message.conversation || m.message.extendedTextMessage?.text;
        if (!text || !text.startsWith(prefix)) return;

        const args = text.slice(prefix.length).trim().split(/ +/);
        const command = args.shift().toLowerCase();

        // Find matching command
        const cmd = commands.find(c => c.name === command || (c.alias && c.alias.includes(command)));
        if (cmd) {
            try {
                await cmd.execute(sock, m, args, { config, globalContextInfo });
            } catch (err) {
                console.error(`❌ Error executing command ${command}:`, err);
            }
        }
    });
}

// Plugin Loader
async function loadPlugins(sock) {
    console.log('🔌 Loading plugins...');
    const pluginDir = path.join(__dirname, 'plugins');
    if (!fs.existsSync(pluginDir)) fs.mkdirSync(pluginDir);

    const files = fs.readdirSync(pluginDir).filter(file => file.endsWith('.js'));
    let count = 0;

    for (const file of files) {
        try {
            const modulePath = path.join(pluginDir, file);
            const module = require(modulePath); // ✅ Using require for plugins
            if (typeof module.default === 'function') {
                const pluginCommands = module.default(sock, globalContextInfo);
                if (Array.isArray(pluginCommands)) {
                    commands.push(...pluginCommands);
                }
                console.log(`  ✅ Loaded: ${file}`);
                count++;
            } else {
                console.warn(`⚠️ Plugin ${file} has no default export function.`);
            }
        } catch (err) {
            console.error(`❌ Failed to load ${file}:`, err);
        }
    }

    return count;
}

// Welcome message
async function sendWelcomeMessage(sock, pluginCount) {
    const welcomeMsg = `*✅ Silva MD Bot is Active!*\n\n` +
        `📌 Prefix: ${prefix}\n` +
        `🔌 Plugins Loaded: ${pluginCount}\n` +
        `📂 Repo: https://github.com/SilvaTechB/silva-md-bot`;

    await sock.sendMessage(sock.user.id, {
        video: { url: 'https://files.catbox.moe/2xxr9h.mp4' },
        caption: welcomeMsg,
        contextInfo: globalContextInfo,
        gifPlayback: true
    });
}

// Start the bot
connectToWhatsApp();

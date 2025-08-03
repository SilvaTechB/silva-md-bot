const baileys = require('@whiskeysockets/baileys');
const { makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion, Browsers, DisconnectReason } = baileys;
const fs = require('fs');
const path = require('path');
const os = require('os');
const express = require('express');
const P = require('pino');
const { pathToFileURL } = require('url');
const config = require('./config.js');

const prefix = config.PREFIX;
const tempDir = path.join(os.tmpdir(), 'silva-cache');
if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

setInterval(() => {
    fs.readdirSync(tempDir).forEach(file => fs.unlinkSync(path.join(tempDir, file)));
}, 5 * 60 * 1000);

const globalContextInfo = {
    forwardingScore: 999,
    isForwarded: true,
    forwardedNewsletterMessageInfo: {
        newsletterJid: '120363200367779016@newsletter',
        newsletterName: 'Silva MD Official 🎧',
        serverMessageId: 144
    }
};

async function connectToWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState(path.join(__dirname, 'sessions'));
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        logger: P({ level: 'silent' }),
        printQRInTerminal: true,
        browser: Browsers.macOS('Safari'),
        auth: state,
        version
    });

    sock.ev.on('connection.update', async update => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            if (lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut) {
                console.log('Reconnecting...');
                await connectToWhatsApp();
            }
        } else if (connection === 'open') {
            console.log('✅ Connected to WhatsApp');
            loadPlugins(sock);
            sendWelcomeMessage(sock);
        }
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('messages.upsert', async ({ messages }) => {
        const m = messages[0];
        if (!m.message) return;
        const text = m.message.conversation || m.message?.extendedTextMessage?.text || '';
        const sender = m.key.remoteJid;

        if (config.READ_MESSAGE) await sock.readMessages([m.key]);

        if (text.startsWith(prefix)) {
            const [cmd] = text.slice(prefix.length).trim().split(/\s+/);
            if (cmd === 'ping') {
                await sock.sendMessage(sender, { text: '✅ Silva MD is online!', contextInfo: globalContextInfo });
            }
        }
    });

    sock.ev.on('message-revoke.everyone', async message => {
        if (config.ANTI_DEL_PATH === 'same') {
            await sock.sendMessage(message.key.remoteJid, {
                text: `⚠️ *Anti-Delete Active*\nMessage deleted.`,
                contextInfo: globalContextInfo
            });
        }
    });

    return sock;
}

function loadPlugins(sock) {
    console.log('🔌 Loading plugins...');
    const pluginDir = path.join(__dirname, 'plugins');
    if (!fs.existsSync(pluginDir)) fs.mkdirSync(pluginDir);
    fs.readdirSync(pluginDir).forEach(file => {
        if (file.endsWith('.js')) {
            const pluginPath = path.join(pluginDir, file);
            delete require.cache[require.resolve(pluginPath)];
            const plugin = require(pluginPath);
            if (typeof plugin === 'function') plugin(sock, config, globalContextInfo);
        }
    });
}

async function sendWelcomeMessage(sock) {
    const msg = `*Hello Silva MD User!*\n\n✅ Silva MD is running...\nPrefix: ${prefix}`;
    await sock.sendMessage(sock.user.id, {
        video: { url: 'https://files.catbox.moe/2xxr9h.mp4' },
        caption: msg,
        contextInfo: globalContextInfo
    });
}

const app = express();
app.get('/', (req, res) => res.send('✅ Silva MD is running!'));
app.listen(9090, () => console.log('🌐 Server running on port 9090'));

(async () => await connectToWhatsApp())();

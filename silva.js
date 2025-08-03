// ✅ Silva MD Bot Main File
const baileys = require('@whiskeysockets/baileys');
const { makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion, Browsers, DisconnectReason } = baileys;
const fs = require('fs');
const path = require('path');
const os = require('os');
const express = require('express');
const P = require('pino');
const { File } = require('megajs');
const config = require('./config.js');

const prefix = config.PREFIX || '.';
const tempDir = path.join(os.tmpdir(), 'silva-cache');
const port = process.env.PORT || 25680;

// ✅ Global Context Info (Forwarded Look)
const globalContextInfo = {
    forwardingScore: 999,
    isForwarded: true,
    forwardedNewsletterMessageInfo: {
        newsletterJid: '120363200367779016@newsletter',
        newsletterName: 'SILVA TECH',
        serverMessageId: 144
    }
};

// ✅ Ensure Temp Directory Exists
if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

// ✅ Clear temp every 5 minutes
setInterval(() => {
    fs.readdirSync(tempDir).forEach(file => fs.unlinkSync(path.join(tempDir, file)));
}, 5 * 60 * 1000);

// ✅ Setup Session from Mega.nz
async function setupSession() {
    const sessionPath = path.join(__dirname, 'sessions', 'creds.json');

    if (!fs.existsSync(sessionPath)) {
        if (!config.SESSION_ID) throw new Error('Missing SESSION_ID in config.js or environment!');

        if (!config.SESSION_ID.startsWith('Silva~')) {
            throw new Error('Invalid Session ID format. Must start with Silva~');
        }

        console.log('⬇ Downloading session from Mega.nz...');
        const megaCode = config.SESSION_ID.replace('Silva~', '');
        const file = File.fromURL(`https://mega.nz/file/${megaCode}`);

        await new Promise((resolve, reject) => {
            file.download((err, data) => {
                if (err) return reject(err);
                fs.mkdirSync(path.join(__dirname, 'sessions'), { recursive: true });
                fs.writeFileSync(sessionPath, data);
                console.log('✅ Session downloaded and saved.');
                resolve();
            });
        });
    }
}

// ✅ Send Welcome Message
async function sendWelcomeMessage(sock) {
    const welcomeMsg = `*Hello ✦ Silva MD ✦ User!*\n\n` +
        `✅ Silva MD Bot is now active!\n\n` +
        `*Prefix:* ${config.PREFIX}\n` +
        `*Bot Name:* ${config.BOT_NAME}\n` +
        `*Mode:* ${config.MODE}\n\n` +
        `⚡ Powered by Silva Tech Inc\n` +
        `GitHub: https://github.com/SilvaTechB/silva-md-bot`;

    await sock.sendMessage(sock.user.id, {
        video: { url: 'https://files.catbox.moe/2xxr9h.mp4' },
        caption: welcomeMsg,
        contextInfo: {
            ...globalContextInfo,
            externalAdReply: {
                title: "✦ Silva MD ✦ Official",
                body: "Your Silva MD Bot is live!",
                thumbnailUrl: "https://files.catbox.moe/5uli5p.jpeg",
                sourceUrl: "https://github.com/SilvaTechB/silva-md-bot",
                mediaType: 1,
                renderLargerThumbnail: true
            }
        }
    });
}

// ✅ Connect to WhatsApp
async function connectToWhatsApp() {
    await setupSession();
    const { state, saveCreds } = await useMultiFileAuthState(path.join(__dirname, 'sessions'));
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        logger: P({ level: config.DEBUG ? 'debug' : 'silent' }),
        printQRInTerminal: false,
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
            await sendWelcomeMessage(sock);
        }
    });

    sock.ev.on('creds.update', saveCreds);

    // ✅ Anti-Delete (Private & Group)
    sock.ev.on('message-revoke.everyone', async msg => {
        try {
            const from = msg.key.remoteJid;
            if ((from.endsWith('@g.us') && config.ANTIDELETE_GROUP === 'true') ||
                (!from.endsWith('@g.us') && config.ANTIDELETE_PRIVATE === 'true')) {
                await sock.sendMessage(from, {
                    text: '⚠️ *Anti-Delete:* Someone tried to delete a message!',
                    contextInfo: globalContextInfo
                });
            }
        } catch (err) {
            console.error('❌ Anti-Delete Error:', err);
        }
    });

    // ✅ Auto-Status View + Reply
    sock.ev.on('status.update', async ({ status }) => {
        try {
            for (const s of status) {
                if (config.AUTO_STATUS_SEEN === 'true') {
                    await sock.readMessages([{ remoteJid: s.jid, id: s.id }]);
                }

                if (config.AUTO_STATUS_REPLY === 'true') {
                    await sock.sendMessage(s.jid, {
                        text: config.AUTO_STATUS__MSG,
                        contextInfo: globalContextInfo
                    });
                }
            }
        } catch (err) {
            console.error('❌ Auto Status Error:', err);
        }
    });

    // ✅ Message Handler: Basic Ping Command
    sock.ev.on('messages.upsert', async ({ messages }) => {
        const m = messages[0];
        if (!m.message) return;

        const sender = m.key.remoteJid;
        const messageContent = m.message?.conversation || m.message?.extendedTextMessage?.text || '';
        const isCmd = messageContent.startsWith(prefix);

        if (config.READ_MESSAGE === 'true') await sock.readMessages([m.key]);

        if (isCmd) {
            const [cmd, ...args] = messageContent.slice(prefix.length).trim().split(/\s+/);
            const command = cmd.toLowerCase();

            if (command === 'ping') {
                await sock.sendMessage(sender, {
                    text: '✅ Bot is online and running! ⚡',
                    contextInfo: globalContextInfo
                }, { quoted: m });
            }
        }
    });

    return sock;
}

// ✅ Express API
const app = express();
app.get('/', (req, res) => res.send('✅ Silva MD Bot is Running!'));
app.listen(port, () => console.log(`🌐 Server running on port ${port}`));

// ✅ Start Bot
(async () => {
    try {
        await connectToWhatsApp();
    } catch (error) {
        console.error('❌ Initialization Error:', error);
        process.exit(1);
    }
})();

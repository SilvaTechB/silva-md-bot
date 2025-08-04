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
const pluginsDir = path.join(__dirname, 'plugins');

// ✅ Global Context Info
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
setInterval(() => {
    fs.readdirSync(tempDir).forEach(file => fs.unlinkSync(path.join(tempDir, file)));
}, 5 * 60 * 1000);

// ✅ Load Plugins
let plugins = new Map();
function loadPlugins() {
    if (!fs.existsSync(pluginsDir)) fs.mkdirSync(pluginsDir);
    const files = fs.readdirSync(pluginsDir).filter(file => file.endsWith('.js'));
    plugins.clear();
    for (const file of files) {
        delete require.cache[require.resolve(path.join(pluginsDir, file))];
        const plugin = require(path.join(pluginsDir, file));
        plugins.set(file.replace('.js', ''), plugin);
    }
    console.log(`✅ Loaded ${plugins.size} plugins`);
}
loadPlugins();

// ✅ Setup Session from Mega.nz
async function setupSession() {
    const sessionPath = path.join(__dirname, 'sessions', 'creds.json');
    if (!fs.existsSync(sessionPath)) {
        if (!config.SESSION_ID || !config.SESSION_ID.startsWith('Silva~')) {
            throw new Error('Invalid or missing SESSION_ID. Must start with Silva~');
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

// ✅ Welcome Message
async function sendWelcomeMessage(sock) {
    const welcomeMsg = `*Hello ✦ Silva MD ✦ User!*\n\n` +
        `✅ Silva MD Bot is now active!\n\n` +
        `*Prefix:* ${prefix}\n` +
        `*Mode:* ${config.MODE}\n` +
        `*Plugins Loaded:* ${plugins.size}\n\n` +
        `⚡ Powered by Silva Tech Inc\nGitHub: https://github.com/SilvaTechB/silva-md-bot`;

    await sock.sendMessage(sock.user.id, {
        image: { url: 'https://files.catbox.moe/5uli5p.jpeg' },
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

    // ✅ Apply SafeSend Override
    const safeSend = require('./lib/safeSend');
    const originalSendMessage = sock.sendMessage.bind(sock);
    sock.sendMessage = async (jid, content, options = {}) => {
        await safeSend(sock, originalSendMessage, jid, content, options);
    };

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

    // ✅ Anti-Delete
    sock.ev.on('message-revoke.everyone', async (msg) => {
        try {
            const from = msg.key.remoteJid;
            const deletedKey = msg.key;
            const participant = msg.participant || msg.key.participant || msg.key.remoteJid;

            if ((from.endsWith('@g.us') && config.ANTIDELETE_GROUP === 'true') ||
                (!from.endsWith('@g.us') && config.ANTIDELETE_PRIVATE === 'true')) {

                const deletedMessage = await sock.loadMessage(deletedKey);
                if (!deletedMessage) return;

                const ownerJid = `${config.OWNER_NUMBER}@s.whatsapp.net`;
                const senderName = participant.split('@')[0];
                let caption = `⚠️ *Anti-Delete Alert!*\n\n👤 *Sender:* @${senderName}\n💬 *Restored Message:*\n\n*Chat:* ${from.endsWith('@g.us') ? 'Group' : 'Private'}`;

                let messageOptions = {
                    contextInfo: {
                        mentionedJid: [participant],
                        ...globalContextInfo,
                        externalAdReply: {
                            title: "Silva MD Anti-Delete",
                            body: "Message restored privately",
                            thumbnailUrl: "https://files.catbox.moe/5uli5p.jpeg",
                            sourceUrl: "https://github.com/SilvaTechB/silva-md-bot",
                            mediaType: 1,
                            renderLargerThumbnail: true
                        }
                    }
                };

                if (deletedMessage.message?.conversation) {
                    await sock.sendMessage(ownerJid, {
                        text: `${caption}\n\n${deletedMessage.message.conversation}`,
                        ...messageOptions
                    });
                } else if (deletedMessage.message?.extendedTextMessage) {
                    await sock.sendMessage(ownerJid, {
                        text: `${caption}\n\n${deletedMessage.message.extendedTextMessage.text}`,
                        ...messageOptions
                    });
                } else if (deletedMessage.message?.imageMessage) {
                    const buffer = await sock.downloadMediaMessage(deletedMessage);
                    await sock.sendMessage(ownerJid, {
                        image: buffer,
                        caption: `${caption}\n\n${deletedMessage.message.imageMessage.caption || ''}`,
                        ...messageOptions
                    });
                } else if (deletedMessage.message?.videoMessage) {
                    const buffer = await sock.downloadMediaMessage(deletedMessage);
                    await sock.sendMessage(ownerJid, {
                        video: buffer,
                        caption: `${caption}\n\n${deletedMessage.message.videoMessage.caption || ''}`,
                        ...messageOptions
                    });
                } else if (deletedMessage.message?.documentMessage) {
                    const buffer = await sock.downloadMediaMessage(deletedMessage);
                    await sock.sendMessage(ownerJid, {
                        document: buffer,
                        mimetype: deletedMessage.message.documentMessage.mimetype,
                        fileName: deletedMessage.message.documentMessage.fileName || 'Restored-File',
                        caption,
                        ...messageOptions
                    });
                } else {
                    await sock.sendMessage(ownerJid, {
                        text: `${caption}\n\n[Unsupported Message Type]`,
                        ...messageOptions
                    });
                }
            }
        } catch (err) {
            console.error('❌ Anti-Delete Full Error:', err);
        }
    });

    // ✅ Auto Status Seen + React + Reply
    sock.ev.on('status.update', async ({ status }) => {
        try {
            for (const s of status) {
                if (!s.id || !s.jid) continue;

                // ✅ Mark status as seen
                if (config.AUTO_STATUS_SEEN === 'true') {
                    await sock.readMessages([{ remoteJid: s.jid, id: s.id }]);
                }

                // ✅ React to status with custom emoji
                if (config.AUTO_STATUS_REACT && config.AUTO_STATUS_REACT.trim() !== '') {
                    await sock.sendMessage(s.jid, {
                        react: {
                            text: config.AUTO_STATUS_REACT,
                            key: { remoteJid: s.jid, id: s.id }
                        }
                    });
                }

                // ✅ Reply to status
                if (config.AUTO_STATUS_REPLY === 'true') {
                    await sock.sendMessage(s.jid, {
                        text: config.AUTO_STATUS_MSG,
                        contextInfo: globalContextInfo
                    });
                }
            }
        } catch (err) {
            console.error('❌ Auto Status Error:', err);
        }
    });

    // ✅ Handle Commands (Updated for Group Support)
    sock.ev.on('messages.upsert', async ({ messages }) => {
        const m = messages[0];
        if (!m.message) return;

        const sender = m.key.remoteJid;
        const isGroup = sender.endsWith('@g.us');
        
        // ✅ Skip if groups are disabled
        if (isGroup && config.ALLOW_GROUPS === 'false') return;
        
        // ✅ Extract content and mentions
        const messageType = Object.keys(m.message)[0];
        let content = '';
        let mentionedJids = [];
        
        if (m.message[messageType]?.contextInfo) {
            mentionedJids = m.message[messageType].contextInfo.mentionedJid || [];
        }
        
        if (messageType === 'conversation') {
            content = m.message.conversation;
        } else if (messageType === 'extendedTextMessage') {
            content = m.message.extendedTextMessage.text || '';
        } else if (messageType === 'imageMessage') {
            content = m.message.imageMessage.caption || '';
        } else if (messageType === 'videoMessage') {
            content = m.message.videoMessage.caption || '';
        } else if (messageType === 'documentMessage') {
            content = m.message.documentMessage.caption || '';
        } else {
            return;
        }
        
        // ✅ Check if bot is mentioned
        const botBareJid = sock.user.id.split(':')[0] + '@s.whatsapp.net';
        const isMentioned = mentionedJids.includes(botBareJid);
        
        // ✅ Group mention handling
        if (isGroup && config.GROUP_REQUIRE_MENTION === 'true' && !isMentioned) return;
        
        // ✅ Check if message starts with prefix
        const hasPrefix = content.startsWith(prefix);
        if (!hasPrefix && !isMentioned) return;
        
        // ✅ Extract command text
        let commandText = hasPrefix 
            ? content.slice(prefix.length).trim()
            : content.trim();
        
        // ✅ Remove bot mention from command if present
        if (isMentioned) {
            const mentionRegex = new RegExp(`@${sock.user.id.split(':')[0]}`, 'i');
            commandText = commandText.replace(mentionRegex, '').trim();
        }
        
        const [cmd, ...args] = commandText.split(/\s+/);
        const command = cmd.toLowerCase();

        if (config.READ_MESSAGE === 'true') await sock.readMessages([m.key]);

        // ✅ Core Commands
        if (command === 'ping') {
            const latency = m.messageTimestamp
                ? new Date().getTime() - m.messageTimestamp * 1000
                : 0;

            return sock.sendMessage(sender, {
                text: `🏓 *Pong!* ${latency} ms Silva MD is live!`,
                contextInfo: {
                    ...globalContextInfo,
                    externalAdReply: {
                        title: "Silva MD speed",
                        body: "Explore the speed",
                        thumbnailUrl: "https://files.catbox.moe/5uli5p.jpeg",
                        sourceUrl: "https://github.com/SilvaTechB/silva-md-bot",
                        mediaType: 1,
                        renderLargerThumbnail: true
                    }
                }
            }, { quoted: m });
        }

        if (command === 'alive') {
            return sock.sendMessage(sender, {
                image: { url: config.ALIVE_IMG },
                caption: config.LIVE_MSG,
                contextInfo: globalContextInfo
            }, { quoted: m });
        }

        if (command === 'menu') {
            const cmds = ['ping', 'alive', 'menu'];
            for (const [_, plugin] of plugins) {
                if (Array.isArray(plugin.commands)) cmds.push(...plugin.commands);
            }

            const menuText = `*✦ Silva MD ✦ Command Menu*\n\n` +
                cmds.map(c => `• ${prefix}${c}`).join('\n') +
                `\n\n⚡ Total Commands: ${cmds.length}\n\n✨ Powered by Silva Tech Inc`;

            return sock.sendMessage(sender, {
                image: { url: 'https://files.catbox.moe/5uli5p.jpeg' },
                caption: menuText,
                contextInfo: {
                    ...globalContextInfo,
                    externalAdReply: {
                        title: "Silva MD Menu",
                        body: "Explore all available commands",
                        thumbnailUrl: "https://files.catbox.moe/5uli5p.jpeg",
                        sourceUrl: "https://github.com/SilvaTechB/silva-md-bot",
                        mediaType: 1,
                        renderLargerThumbnail: true
                    }
                }
            }, { quoted: m });
        }

        // ✅ Plugin Commands
        for (const plugin of plugins.values()) {
            if (plugin.commands && plugin.commands.includes(command)) {
                try {
                    await plugin.handler({ sock, m, sender, args, contextInfo: globalContextInfo });
                } catch (err) {
                    console.error(`❌ Error in plugin ${plugin.commands}:`, err);
                }
                return;
            }
        }
    });

    return sock;
}

// ✅ Express Web API
const app = express();
app.get('/', (req, res) => res.send('✅ Silva MD Bot is Running!'));
app.listen(port, () => console.log(`🌐 Server running on port ${port}`));

// ✅ Boot Bot
(async () => {
    try {
        await connectToWhatsApp();
    } catch (e) {
        console.error('❌ Bot Init Failed:', e);
        process.exit(1);
    }
})();

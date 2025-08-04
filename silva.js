// ✅ Silva MD Bot Main File - Newsletter Enhanced
const baileys = require('@whiskeysockets/baileys');
const { makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion, Browsers, DisconnectReason, isJidGroup, isJidBroadcast, isJidStatusBroadcast, areJidsSameUser } = baileys;
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

// ✅ Message Logger Setup
const logDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir);

function getLogFileName() {
    const date = new Date();
    return `messages-${date.getFullYear()}-${date.getMonth()+1}-${date.getDate()}.log`;
}

function logMessage(type, message) {
    if (!config.DEBUG && type === 'DEBUG') return;
    
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] [${type}] ${message}\n`;
    
    // Log to console
    console.log(logEntry.trim());
    
    // Log to file
    const logFile = path.join(logDir, getLogFileName());
    fs.appendFileSync(logFile, logEntry);
}

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
    logMessage('INFO', `✅ Loaded ${plugins.size} plugins`);
}
loadPlugins();

// ✅ Setup Session from Mega.nz
async function setupSession() {
    const sessionPath = path.join(__dirname, 'sessions', 'creds.json');
    if (!fs.existsSync(sessionPath)) {
        if (!config.SESSION_ID || !config.SESSION_ID.startsWith('Silva~')) {
            throw new Error('Invalid or missing SESSION_ID. Must start with Silva~');
        }
        logMessage('INFO', '⬇ Downloading session from Mega.nz...');
        const megaCode = config.SESSION_ID.replace('Silva~', '');
        const file = File.fromURL(`https://mega.nz/file/${megaCode}`);
        await new Promise((resolve, reject) => {
            file.download((err, data) => {
                if (err) return reject(err);
                fs.mkdirSync(path.join(__dirname, 'sessions'), { recursive: true });
                fs.writeFileSync(sessionPath, data);
                logMessage('SUCCESS', '✅ Session downloaded and saved.');
                resolve();
            });
        });
    }
}

// ✅ Generate Config Table
function generateConfigTable() {
    const configs = [
        { name: 'MODE', value: config.MODE },
        { name: 'ANTIDELETE_GROUP', value: config.ANTIDELETE_GROUP },
        { name: 'ANTIDELETE_PRIVATE', value: config.ANTIDELETE_PRIVATE },
        { name: 'AUTO_STATUS_SEEN', value: config.AUTO_STATUS_SEEN },
        { name: 'AUTO_STATUS_REACT', value: config.AUTO_STATUS_REACT },
        { name: 'AUTO_STATUS_REPLY', value: config.AUTO_STATUS_REPLY },
        { name: 'AUTO_REACT_NEWSLETTER', value: config.AUTO_REACT_NEWSLETTER },
        { name: 'ANTI_LINK', value: config.ANTI_LINK },
        { name: 'ALWAYS_ONLINE', value: config.ALWAYS_ONLINE }
    ];

    let table = '╔══════════════════════════╦═══════════╗\n';
    table += '║        Config Name       ║   Value   ║\n';
    table += '╠══════════════════════════╬═══════════╣\n';

    for (const config of configs) {
        const paddedName = config.name.padEnd(24, ' ');
        const paddedValue = String(config.value).padEnd(9, ' ');
        table += `║ ${paddedName} ║ ${paddedValue} ║\n`;
    }

    table += '╚══════════════════════════╩═══════════╝';
    return table;
}

// ✅ Fancy Bio Generator
function generateFancyBio() {
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-KE', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
    
    const timeStr = now.toLocaleTimeString('en-KE', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });
    
    const bios = [
        `✨ ${config.BOT_NAME} ✦ Online ✦ ${dateStr} ✦`,
        `⚡ Silva MD Active ✦ ${timeStr} ✦ ${dateStr} ✦`,
        `💫 ${config.BOT_NAME} Operational ✦ ${dateStr} ✦`,
        `🚀 Silva MD Live ✦ ${dateStr} ✦ ${timeStr} ✦`,
        `🌟 ${config.BOT_NAME} Running ✦ ${dateStr} ✦`
    ];
    
    return bios[Math.floor(Math.random() * bios.length)];
}

// ✅ Welcome Message with Config Status
async function sendWelcomeMessage(sock) {
    const configTable = generateConfigTable();
    
    const welcomeMsg = `*Hello ✦ ${config.BOT_NAME} ✦ User!*\n\n` +
        `✅ Silva MD Bot is now active!\n\n` +
        `*Prefix:* ${prefix}\n` +
        `*Mode:* ${config.MODE}\n` +
        `*Plugins Loaded:* ${plugins.size}\n\n` +
        `*⚙️ Configuration Status:*\n\`\`\`${configTable}\`\`\`\n\n` +
        `*Description:* ${config.DESCRIPTION}\n\n` +
        `⚡ Powered by Silva Tech Inc\nGitHub: https://github.com/SilvaTechB/silva-md-bot`;

    await sock.sendMessage(sock.user.id, {
        image: { url: config.ALIVE_IMG },
        caption: welcomeMsg,
        contextInfo: {
            ...globalContextInfo,
            externalAdReply: {
                title: `✦ ${config.BOT_NAME} ✦ Official`,
                body: "Your bot is live with enhanced features!",
                thumbnailUrl: "https://files.catbox.moe/5uli5p.jpeg",
                sourceUrl: "https://github.com/SilvaTechB/silva-md-bot",
                mediaType: 1,
                renderLargerThumbnail: true
            }
        }
    });
}

// ✅ Update Profile Status
async function updateProfileStatus(sock) {
    try {
        const bio = generateFancyBio();
        await sock.updateProfileStatus(bio);
        logMessage('SUCCESS', `✅ Bio updated: ${bio}`);
    } catch (err) {
        logMessage('ERROR', `❌ Failed to update bio: ${err.message}`);
    }
}

// ✅ Connect to WhatsApp
async function connectToWhatsApp() {
    await setupSession();
    const { state, saveCreds } = await useMultiFileAuthState(path.join(__dirname, 'sessions'));
    const { version } = await fetchLatestBaileysVersion();

    // ✅ Enhanced encryption settings
    const cryptoOptions = {
        maxSharedKeys: 1000,
        sessionThreshold: 0,
        cache: {
            TRANSACTION: false,
            PRE_KEYS: false
        }
    };

    const sock = makeWASocket({
        logger: P({ level: config.DEBUG ? 'debug' : 'silent' }),
        printQRInTerminal: false,
        browser: Browsers.macOS('Safari'),
        auth: state,
        version,
        markOnlineOnConnect: config.ALWAYS_ONLINE,
        syncFullHistory: false,
        generateHighQualityLinkPreview: false,
        getMessage: async () => undefined,
        ...cryptoOptions
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
            logMessage('WARN', `Connection closed: ${lastDisconnect?.error?.output?.statusCode || 'Unknown'}`);
            if (lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut) {
                logMessage('INFO', 'Reconnecting...');
                setTimeout(() => connectToWhatsApp(), 2000);
            }
        } else if (connection === 'open') {
            logMessage('SUCCESS', '✅ Connected to WhatsApp');
            
            // ✅ Update profile status with fancy bio
            await updateProfileStatus(sock);
            
            // ✅ Send welcome message
            await sendWelcomeMessage(sock);
        }
    });

    sock.ev.on('creds.update', saveCreds);

    // ✅ Anti-Delete - Fixed Implementation
    sock.ev.on('messages.update', async (updates) => {
        for (const update of updates) {
            if (update.update.messageStubType === 7) { // Message deleted for everyone
                try {
                    const key = update.key;
                    const from = key.remoteJid;
                    const isGroup = isJidGroup(from);
                    
                    logMessage('EVENT', `Anti-Delete triggered in ${isGroup ? 'group' : 'private'}: ${from}`);
                    
                    // Check if anti-delete is enabled for this chat type
                    if ((isGroup && config.ANTIDELETE_GROUP) || 
                        (!isGroup && config.ANTIDELETE_PRIVATE)) {
                        
                        // Load the deleted message
                        const deletedMessage = await sock.loadMessage(key);
                        if (!deletedMessage) {
                            logMessage('WARN', 'Could not load deleted message');
                            return;
                        }
                        
                        const ownerJid = `${config.OWNER_NUMBER}@s.whatsapp.net`;
                        const sender = update.participant || key.participant || key.remoteJid;
                        const senderName = sender.split('@')[0];
                        
                        let caption = `⚠️ *Anti-Delete Alert!*\n\n` +
                            `👤 *Sender:* @${senderName}\n` +
                            `💬 *Restored Message:*\n\n` +
                            `*Chat:* ${isGroup ? 'Group' : 'Private'}`;
                        
                        let messageOptions = {
                            contextInfo: {
                                mentionedJid: [sender],
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
                        
                        // Log message content
                        let msgContent = '';
                        if (deletedMessage.message?.conversation) {
                            msgContent = deletedMessage.message.conversation;
                        } else if (deletedMessage.message?.extendedTextMessage) {
                            msgContent = deletedMessage.message.extendedTextMessage.text;
                        } else if (deletedMessage.message?.imageMessage) {
                            msgContent = '[Image] ' + (deletedMessage.message.imageMessage.caption || '');
                        } else if (deletedMessage.message?.videoMessage) {
                            msgContent = '[Video] ' + (deletedMessage.message.videoMessage.caption || '');
                        } else if (deletedMessage.message?.documentMessage) {
                            msgContent = '[Document] ' + (deletedMessage.message.documentMessage.fileName || '');
                        } else {
                            msgContent = '[Unsupported Type]';
                        }
                        
                        logMessage('INFO', `Restoring message: ${msgContent.substring(0, 100)}`);
                        
                        // Handle different message types
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
                        
                        logMessage('SUCCESS', 'Anti-Delete message sent to owner');
                    }
                } catch (err) {
                    logMessage('ERROR', `Anti-Delete Error: ${err.message}`);
                }
            }
        }
    });

    // ✅ Auto Status Seen + React + Reply - Enhanced
    sock.ev.on('status.update', async ({ status }) => {
        try {
            for (const s of status) {
                if (!s.id || !s.jid) continue;
                
                logMessage('EVENT', `Status update from ${s.jid}: ${s.id}`);

                // ✅ Mark status as seen
                if (config.AUTO_STATUS_SEEN) {
                    try {
                        await sock.readMessages([{ remoteJid: s.jid, id: s.id }]);
                        logMessage('INFO', `Status seen: ${s.id}`);
                    } catch (e) {
                        logMessage('WARN', `Status seen failed: ${e.message}`);
                    }
                }

                // ✅ React to status with custom emoji
                if (config.AUTO_STATUS_REACT) {
                    try {
                        const emojis = config.CUSTOM_REACT_EMOJIS.split(',');
                        const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)].trim();
                        
                        await sock.sendMessage(s.jid, {
                            react: {
                                text: randomEmoji,
                                key: { remoteJid: s.jid, id: s.id }
                            }
                        });
                        logMessage('INFO', `Status reacted: ${randomEmoji}`);
                    } catch (e) {
                        logMessage('WARN', `Status react failed: ${e.message}`);
                    }
                }

                // ✅ Reply to status
                if (config.AUTO_STATUS_REPLY) {
                    try {
                        await sock.sendMessage(s.jid, {
                            text: config.AUTO_STATUS_MSG,
                            contextInfo: globalContextInfo
                        });
                        logMessage('INFO', `Status replied: ${s.id}`);
                    } catch (e) {
                        logMessage('WARN', `Status reply failed: ${e.message}`);
                    }
                }
            }
        } catch (err) {
            logMessage('ERROR', `Auto Status Error: ${err.message}`);
        }
    });

    // ✅ Handle Commands with Enhanced Session Handling
    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type !== 'notify') return;
        
        const m = messages[0];
        if (!m.message) return;

        const sender = m.key.remoteJid;
        const isGroup = isJidGroup(sender);
        const isNewsletter = sender.endsWith('@newsletter');
        const isBroadcast = isJidBroadcast(sender) || isJidStatusBroadcast(sender);
        
        // Log incoming message
        logMessage('MESSAGE', `New ${isNewsletter ? 'newsletter' : isGroup ? 'group' : isBroadcast ? 'broadcast' : 'private'} message from ${sender}`);
        
        // ✅ Auto-react to newsletter messages
        if (isNewsletter && config.AUTO_REACT_NEWSLETTER) {
            try {
                await sock.sendMessage(sender, {
                    react: {
                        text: '🤖', // Robot emoji
                        key: m.key
                    }
                });
                logMessage('INFO', `Reacted to newsletter message`);
            } catch (e) {
                logMessage('ERROR', `Newsletter react failed: ${e.message}`);
            }
        }
        
        // ✅ Extract content
        const messageType = Object.keys(m.message)[0];
        let content = '';
        
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
        
        // Log message content
        logMessage('DEBUG', `Message content: ${content.substring(0, 100)}`);
        
        // ✅ Check if message starts with prefix
        const hasPrefix = content.startsWith(prefix);
        if (!hasPrefix) {
            logMessage('INFO', 'Message ignored (no prefix)');
            return;
        }
        
        // ✅ Extract command text
        let commandText = content.slice(prefix.length).trim();
        const [cmd, ...args] = commandText.split(/\s+/);
        const command = cmd.toLowerCase();

        logMessage('COMMAND', `Command detected: ${command} | Args: ${args.join(' ')}`);

        if (config.READ_MESSAGE) await sock.readMessages([m.key]);

        // ✅ Core Commands
        if (command === 'ping') {
            const latency = m.messageTimestamp
                ? new Date().getTime() - m.messageTimestamp * 1000
                : 0;

            return sock.sendMessage(sender, {
                text: `🏓 *Pong!* ${latency} ms ${config.BOT_NAME} is live!`,
                contextInfo: {
                    ...globalContextInfo,
                    externalAdReply: {
                        title: `${config.BOT_NAME} speed`,
                        body: "Explore the speed",
                        thumbnailUrl: "https://files.catbox.moe/5uli5p.jpeg",
                        sourceUrl: "https://github.com/SilvaTechB/silva-md-bot",
                        mediaType: 1,
                        renderLargerThumbnail: true
                    }
                }
            }, { quoted: m });
        }

        if (command === 'resetsession') {
            const ownerJid = `${config.OWNER_NUMBER}@s.whatsapp.net`;
            if (sender !== ownerJid) {
                return sock.sendMessage(sender, { text: '❌ This command is only for the owner!' }, { quoted: m });
            }

            if (isGroup) {
                await sock.sendMessage(sender, {
                    protocolMessage: {
                        senderKeyDistributionMessage: {
                            groupId: sender
                        }
                    }
                });
                return sock.sendMessage(sender, { text: '✅ Group session reset initiated!' }, { quoted: m });
            }

            return sock.sendMessage(sender, { text: '✅ Session reset!' }, { quoted: m });
        }

        if (command === 'alive') {
            return sock.sendMessage(sender, {
                image: { url: config.ALIVE_IMG },
                caption: config.LIVE_MSG,
                contextInfo: globalContextInfo
            }, { quoted: m });
        }

        if (command === 'menu') {
            const cmds = ['ping', 'alive', 'menu', 'resetsession'];
            for (const [_, plugin] of plugins) {
                if (Array.isArray(plugin.commands)) cmds.push(...plugin.commands);
            }

            const menuText = `*✦ ${config.BOT_NAME} ✦ Command Menu*\n\n` +
                cmds.map(c => `• ${prefix}${c}`).join('\n') +
                `\n\n⚡ Total Commands: ${cmds.length}\n\n✨ ${config.DESCRIPTION}`;

            return sock.sendMessage(sender, {
                image: { url: 'https://files.catbox.moe/5uli5p.jpeg' },
                caption: menuText,
                contextInfo: {
                    ...globalContextInfo,
                    externalAdReply: {
                        title: config.BOT_NAME,
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
                    logMessage('PLUGIN', `Executing plugin: ${plugin.commands}`);
                    await plugin.handler({ sock, m, sender, args, contextInfo: globalContextInfo });
                    logMessage('SUCCESS', `Plugin executed: ${plugin.commands}`);
                } catch (err) {
                    logMessage('ERROR', `Plugin error: ${plugin.commands} - ${err.message}`);
                    sock.sendMessage(sender, { 
                        text: `❌ Plugin error: ${err.message || 'Unknown error'}` 
                    }, { quoted: m });
                }
                return;
            }
        }
        
        logMessage('WARN', `Command not found: ${command}`);
    });

    return sock;
}

// ✅ Express Web API
const app = express();
app.get('/', (req, res) => res.send(`✅ ${config.BOT_NAME} is Running!`));
app.listen(port, () => logMessage('INFO', `🌐 Server running on port ${port}`));

// ✅ Error handling to prevent crashes
process.on('uncaughtException', (err) => {
    logMessage('CRITICAL', `Uncaught Exception: ${err.stack}`);
    // Auto-restart on critical error
    setTimeout(() => connectToWhatsApp(), 5000);
});

process.on('unhandledRejection', (reason, promise) => {
    logMessage('CRITICAL', `Unhandled Rejection: ${reason} at ${promise}`);
});

// ✅ Boot Bot
(async () => {
    try {
        logMessage('INFO', 'Booting Silva MD Bot...');
        await connectToWhatsApp();
    } catch (e) {
        logMessage('CRITICAL', `Bot Init Failed: ${e.stack}`);
        // Auto-restart on failure
        setTimeout(() => connectToWhatsApp(), 5000);
    }
})();

const { File: BufferFile } = require('node:buffer');
global.File = BufferFile;

// ✅ Silva Tech Inc Property 2025
const baileys = require('@whiskeysockets/baileys');
const { makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion, Browsers, DisconnectReason, isJidGroup, isJidBroadcast, isJidStatusBroadcast, areJidsSameUser, makeInMemoryStore, downloadContentFromMessage } = baileys;
const fs = require('fs');
const path = require('path');
const os = require('os');
const express = require('express');
const P = require('pino');
const config = require('./config.js');
const store = makeInMemoryStore({ logger: P({ level: 'silent' }) });

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
// Helper to download any media as Buffer
async function downloadAsBuffer(mediaMessage, kind) {
    const stream = await downloadContentFromMessage(mediaMessage, kind);
    const chunks = [];
    for await (const chunk of stream) chunks.push(chunk);
    return Buffer.concat(chunks);
}

function logMessage(type, message) {
    if (!config.DEBUG && type === 'DEBUG') return;

    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] [${type}] ${message}\n`;

    console.log(logEntry.trim());

    const logFile = path.join(logDir, getLogFileName());
    fs.appendFileSync(logFile, logEntry);
} 
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
        newsletterName: '◢◤ Silva Tech Inc ◢◤',
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
        
        // ✅ Fixed MegaJS usage
        const mega = require('megajs');
        const file = mega.File.fromURL(`https://mega.nz/file/${megaCode}`);
        
        await new Promise((resolve, reject) => {
            file.download((err, data) => {
                if (err) {
                    logMessage('ERROR', `❌ Mega download failed: ${err.message}`);
                    return reject(err);
                }
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
        { name: 'ALWAYS_ONLINE', value: config.ALWAYS_ONLINE },
        { name: 'GROUP_COMMANDS', value: config.GROUP_COMMANDS }
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

// ✅ Enhanced Group Message Handling
function isBotMentioned(message, botJid) {
    if (!message || !botJid) return false;
    
    // Check for mentions in extended text messages
    if (message.extendedTextMessage) {
        const mentionedJids = message.extendedTextMessage.contextInfo?.mentionedJid || [];
        return mentionedJids.includes(botJid);
    }
    
    // Check for mentions in conversation messages
    if (message.conversation) {
        const botNumber = botJid.split('@')[0];
        return message.conversation.includes(`@${botNumber}`);
    }
    
    return false;
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

    // Remove safeSend override
    // ✅ Group messages will be handled natively

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
            
            // Store bot JID for mention detection
            global.botJid = sock.user.id;
            
            // ✅ Update profile status with fancy bio
            await updateProfileStatus(sock);
            
            // ✅ Send welcome message
            await sendWelcomeMessage(sock);
        }
    });

    sock.ev.on('creds.update', saveCreds);

    // Anti-delete logic goes here 👇
    sock.ev.on('messages.delete', async (item) => {
        try {
            const keys = Array.isArray(item) ? item.map(i => i.key) : (item?.keys || []);
            for (const key of keys) {
                const from = key.remoteJid;
                const isGroup = from.endsWith('@g.us');

                if ((isGroup && !config.ANTIDELETE_GROUP) || (!isGroup && !config.ANTIDELETE_PRIVATE)) continue;

                const deletedMsg = await store.loadMessage(from, key.id);
                if (!deletedMsg) {
                    console.log(`WARN: No stored message found for ${key.id}`);
                    continue;
                }

                const ownerJid = `${config.OWNER_NUMBER}@s.whatsapp.net`;
                const sender = key.participant || from;
                const senderName = sender.split('@')[0];

                const caption = `⚠️ *Anti-Delete Alert!*\n\n👤 *Sender:* @${senderName}\n*Chat:* ${isGroup ? 'Group' : 'Private'}\n\n💬 *Restored Message:*`;

                const opts = { contextInfo: { mentionedJid: [sender] } };
                const msg = deletedMsg.message;

                if (msg.conversation) {
                    await sock.sendMessage(ownerJid, { text: `${caption}\n\n${msg.conversation}`, ...opts });
                } else if (msg.extendedTextMessage) {
                    await sock.sendMessage(ownerJid, { text: `${caption}\n\n${msg.extendedTextMessage.text}`, ...opts });
                } else if (msg.imageMessage) {
                    const buffer = await downloadAsBuffer(msg.imageMessage, 'image');
                    await sock.sendMessage(ownerJid, { image: buffer, caption: `${caption}\n\n${msg.imageMessage.caption || ''}`, ...opts });
                } else if (msg.videoMessage) {
                    const buffer = await downloadAsBuffer(msg.videoMessage, 'video');
                    await sock.sendMessage(ownerJid, { video: buffer, caption: `${caption}\n\n${msg.videoMessage.caption || ''}`, ...opts });
                } else if (msg.documentMessage) {
                    const buffer = await downloadAsBuffer(msg.documentMessage, 'document');
                    await sock.sendMessage(ownerJid, { document: buffer, mimetype: msg.documentMessage.mimetype, fileName: msg.documentMessage.fileName || 'Restored-File', caption, ...opts });
                } else {
                    await sock.sendMessage(ownerJid, { text: `${caption}\n\n[Unsupported Message Type]`, ...opts });
                }

                console.log(`SUCCESS: Restored deleted message from ${senderName}`);
            }
        } catch (err) {
            console.error(`ERROR (Anti-Delete): ${err.message}`);
        }
    });

// ✅ Auto Status Seen + React + Reply - Enhanced (Full Updated)
const statusSaverDir = path.join(__dirname, 'status_saver');
if (!fs.existsSync(statusSaverDir)) {
    fs.mkdirSync(statusSaverDir, { recursive: true });
}
// Media saving helper
async function saveMedia(message, msgType, sock, caption) {
    try {
        const stream = await downloadContentFromMessage(
            message.message[msgType],
            msgType.replace('Message', '')
        );

        let buffer = Buffer.from([]);
        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk]);
        }

        const extMap = {
            imageMessage: 'jpg',
            videoMessage: 'mp4',
            audioMessage: 'ogg'
        };

        const filename = `${Date.now()}.${extMap[msgType]}`;
        const filePath = path.join(statusSaverDir, filename);
        fs.writeFileSync(filePath, buffer);
        // Send to self chat
        const selfJid = sock.user.id.includes(':')
            ? `${sock.user.id.split(':')[0]}@s.whatsapp.net`
            : sock.user.id;

        await sock.sendMessage(selfJid, {
            [msgType.replace('Message', '')]: { url: filePath },
            caption: caption,
            mimetype: message.message[msgType].mimetype
        });

        return true;
    } catch (error) {
        logMessage('ERROR', `Media Save Error: ${error.message}`);
        return false;
    }
}
// Helper to unwrap statuses
function unwrapStatus(msg) {
    const inner =
        msg.message?.viewOnceMessageV2?.message ||
        msg.message?.viewOnceMessage?.message ||
        msg.message || {};
    const msgType = Object.keys(inner)[0] || '';
    return { inner, msgType };
}
// Main handler
sock.ev.on('messages.upsert', async ({ messages }) => {
    try {
        for (const message of messages) {
            if (message.key.remoteJid !== 'status@broadcast') continue;

            const statusId = message.key.id;
            const userJid = message.key.participant;

            logMessage('EVENT', `Status update from ${userJid}: ${statusId}`);

            const { inner, msgType } = unwrapStatus(message);
            // ✅ 1. Mark status as seen (correct way)
            if (config.AUTO_STATUS_SEEN) {
                try {
                    await sock.sendReadReceipt('status@broadcast', userJid, [statusId]);
                    logMessage('INFO', `Status seen (sent read receipt): ${statusId}`);
                } catch (e) {
                    logMessage('WARN', `Status seen failed: ${e.message}`);
                }
            }

            // ✅ 2. True status reaction (no DM) — attaches reaction to the story itself
            if (config.AUTO_STATUS_REACT) {
                try {
                    const emojis = (config.CUSTOM_REACT_EMOJIS || '❤️,🔥,💯,😍,👏').split(',');
                    const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)].trim();

                    const selfJid = sock.user.id.includes(':')
                        ? `${sock.user.id.split(':')[0]}@s.whatsapp.net`
                        : sock.user.id;

                    await sock.sendMessage(
                        'status@broadcast',
                        {
                            react: {
                                text: randomEmoji,
                                key: message.key // react on the exact status message
                            }
                        },
                        {
                            // required for status reactions to be routed correctly
                            additionalAttributes: {
                                statusJidList: [userJid, selfJid]
                            }
                        }
                    );

                    logMessage('INFO', `Reacted on status ${statusId} with: ${randomEmoji}`);
                } catch (e) {
                    logMessage('WARN', `Status reaction failed: ${e.message}`);
                }
            }

            // ✅ 3. Reply to status (quoting it) — controlled by your config flag
            if (config.AUTO_STATUS_REPLY) {
                try {
                    await sock.sendMessage(userJid, {
                        text: config.AUTO_STATUS_MSG,
                        contextInfo: {
                            stanzaId: statusId,
                            participant: userJid,
                            quotedMessage: inner
                        }
                    });
                    logMessage('INFO', `Status replied: ${statusId}`);
                } catch (e) {
                    logMessage('WARN', `Status reply failed: ${e.message}`);
                }
            }

            // ✅ 4. Status saving feature
            if (config.Status_Saver === 'true') {
                try {
                    const userName = await sock.getName(userJid) || 'Unknown';
                    const statusHeader = 'AUTO STATUS SAVER';
                    let caption = `${statusHeader}\n\n*🩵 Status From:* ${userName}`;

                    switch (msgType) {
                        case 'imageMessage':
                        case 'videoMessage':
                            if (inner[msgType]?.caption) {
                                caption += `\n*🩵 Caption:* ${inner[msgType].caption}`;
                            }
                            await saveMedia({ message: inner }, msgType, sock, caption);
                            break;

                        case 'audioMessage':
                            caption += `\n*🩵 Audio Status*`;
                            await saveMedia({ message: inner }, msgType, sock, caption);
                            break;

                        case 'extendedTextMessage':
                            caption = `${statusHeader}\n\n${inner.extendedTextMessage?.text || ''}`;
                            await sock.sendMessage(sock.user.id, { text: caption });
                            break;

                        default:
                            logMessage('WARN', `Unsupported status type: ${msgType}`);
                            break;
                    }

                    // Optional: DM confirmation to the user (kept as-is, behind your flag)
                    if (config.STATUS_REPLY === 'true') {
                        const replyMsg = config.STATUS_MSG || 'SILVA MD 💖 SUCCESSFULLY VIEWED YOUR STATUS';
                        await sock.sendMessage(userJid, { text: replyMsg });
                    }

                    logMessage('INFO', `Status saved: ${statusId}`);
                } catch (e) {
                    logMessage('ERROR', `Status save failed: ${e.message}`);
                }
            }
        }
    } catch (err) {
        logMessage('ERROR', `Status Handler Error: ${err.message}`);
    }
});



    // ✅ Handle Commands with Enhanced Group Support
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
        
        // ✅ Auto-react to newsletter (WhatsApp Channel) messages
if (
    m.key?.remoteJid?.endsWith('@newsletter') &&
    config.AUTO_REACT_NEWSLETTER
) {
    try {
        await sock.sendMessage(m.key.remoteJid, {
            react: {
                text: '🤖', // Robot emoji
                key: m.key
            }
        });
        logMessage('INFO', `Reacted to newsletter message in: ${m.key.remoteJid}`);
    } catch (e) {
        logMessage('ERROR', `Newsletter react failed: ${e.message}`);
    }
}       
        // Skip processing if group commands are disabled
        if (isGroup && !config.GROUP_COMMANDS) {
            logMessage('DEBUG', 'Group commands disabled, skipping message');
            return;
        }
        
        // ✅ Extract content
        const messageType = Object.keys(m.message)[0];
        let content = '';
        let isMentioned = false;
        
        if (messageType === 'conversation') {
            content = m.message.conversation;
        } else if (messageType === 'extendedTextMessage') {
            content = m.message.extendedTextMessage.text || '';
            // Check if bot is mentioned in group
            if (isGroup && global.botJid) {
                isMentioned = isBotMentioned(m.message, global.botJid);
            }
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
        
        // ✅ Check if message is for the bot (prefix or mention in group)
        let isForBot = false;
        
        if (isGroup) {
            // In groups, accept either prefix or mention
            isForBot = content.startsWith(prefix) || isMentioned;
        } else {
            // In private chats, only prefix is needed
            isForBot = content.startsWith(prefix);
        }
        
        if (!isForBot) {
            logMessage('INFO', 'Message not for bot, ignoring');
            return;
        }
        
        // If mentioned, remove mention from content
        if (isMentioned) {
            const botNumber = global.botJid.split('@')[0];
            content = content.replace(new RegExp(`@${botNumber}\\s*`, 'i'), '').trim();
        }
        
        // ✅ Extract command text
        let commandText = content.startsWith(prefix) 
            ? content.slice(prefix.length).trim() 
            : content.trim();
            
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
                    await plugin.handler({ sock, m, sender, args, contextInfo: globalContextInfo, isGroup });
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

// Serve static files from the 'smm' directory
app.use(express.static(path.join(__dirname, 'smm')));

// Main route - serve the HTML dashboard
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'smm', 'silva.html'));
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.send(`✅ ${config.BOT_NAME} is Running!`);
});

app.listen(port, () => {
    logMessage('INFO', `🌐 Server running on port ${port}`);
    logMessage('INFO', `📊 Dashboard available at http://localhost:${port}`);
});

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

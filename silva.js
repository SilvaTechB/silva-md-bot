// ==============================
// 📦 IMPORTS SECTION
// ==============================
const {
    makeWASocket,
    DisconnectReason,
    useMultiFileAuthState,
    downloadMediaMessage,
    getContentType,
    Browsers,
    makeCacheableSignalKeyStore,
    fetchLatestBaileysVersion,
    delay,
    proto
} = require('@whiskeysockets/baileys');

const { Boom } = require('@hapi/boom');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const NodeCache = require('node-cache');
const qrcode = require('qrcode-terminal');
const pino = require('pino');

// Import configuration
const config = require('./config.js');

// Import status handler
const statusHandler = require('./lib/status.js');

// Import auto-updater
const updater = require('./lib/updater.js');

// Start media API server
try {
    const mediaApi = require('./lib/mediaApi.js');
    mediaApi.startApi();
} catch (e) {
    console.log('[API] Media API failed to start:', e.message);
}

// ==============================
// 🔒 SECURITY CHECK
// ==============================
(() => {
    try {
        const _p = require('./package.json');
        const _a = (_p.author || '').toLowerCase();
        const _k = [115, 105, 108, 118, 97];
        const _v = _k.map(c => String.fromCharCode(c)).join('');
        if (!_a.includes(_v)) {
            console.log('\x1b[31m[SECURITY] Unauthorized modification detected. Bot cannot start.\x1b[0m');
            console.log('\x1b[31m[SECURITY] Package author must contain original author name.\x1b[0m');
            process.exit(1);
        }
    } catch (e) {
        console.log('\x1b[31m[SECURITY] Security check failed: ' + e.message + '\x1b[0m');
        process.exit(1);
    }
})();

// Global Context Info
const globalContextInfo = {
    forwardingScore: 999,
    isForwarded: true,
    forwardedNewsletterMessageInfo: {
        newsletterJid: '120363200367779016@newsletter',
        newsletterName: '◢◤ Silva Tech Nexus ◢◤',
        serverMessageId: 144
    }
};

// ==============================
// 🪵 LOGGER SECTION (ENHANCED FOR DEBUGGING)
// ==============================
const logger = pino({ level: 'silent' });

// Enhanced logger for bot messages
class BotLogger {
    log(type, message) {
        if (type === 'DEBUG' && !config.DEBUG_MODE) return;
        const timestamp = new Date().toISOString();
        const colors = {
            SUCCESS: '\x1b[32m',
            ERROR: '\x1b[31m',
            INFO: '\x1b[36m',
            WARNING: '\x1b[33m',
            BOT: '\x1b[35m',
            DEBUG: '\x1b[90m',
            MESSAGE: '\x1b[34m',
            COMMAND: '\x1b[95m',
            RESET: '\x1b[0m'
        };
        console.log(`${colors[type] || colors.INFO}[${type}] ${timestamp} - ${message}${colors.RESET}`);
    }
}

const botLogger = new BotLogger();

// ==============================
// 🔐 SESSION MANAGEMENT
// ==============================
async function loadSession() {
    try {
        const credsPath = './sessions/creds.json';
        
        if (!fs.existsSync('./sessions')) {
            fs.mkdirSync('./sessions', { recursive: true });
        }

        // If no SESSION_ID, keep existing session files if they exist
        if (!config.SESSION_ID || typeof config.SESSION_ID !== 'string') {
            if (fs.existsSync(credsPath)) {
                botLogger.log('SUCCESS', "✅ Using existing session");
                return true;
            }
            botLogger.log('WARNING', "No session found. Scan QR code or set SESSION_ID");
            return false;
        }

        const [header, b64data] = config.SESSION_ID.split('~');

        if (header !== "Silva" || !b64data) {
            botLogger.log('ERROR', "Invalid session format");
            if (fs.existsSync(credsPath)) {
                botLogger.log('INFO', "Using existing session instead");
                return true;
            }
            return false;
        }

        const cleanB64 = b64data.replace('...', '');
        const compressedData = Buffer.from(cleanB64, 'base64');
        const decompressedData = zlib.gunzipSync(compressedData);

        fs.writeFileSync(credsPath, decompressedData, "utf8");
        botLogger.log('SUCCESS', "✅ Session loaded from SESSION_ID");
        return true;
    } catch (e) {
        botLogger.log('ERROR', "Session Error: " + e.message);
        return false;
    }
}

// ==============================
// 🔧 UTILITY FUNCTIONS (FIXED FOR LID OWNER DETECTION)
// ==============================
class FunctionsWrapper {
    constructor() {
        this.tempDir = path.join(__dirname, './temp');
        if (!fs.existsSync(this.tempDir)) {
            fs.mkdirSync(this.tempDir, { recursive: true });
        }
        this.botNumber = null;
        this.botLid = null; // Store bot's LID
    }

    async isAdmin(message, sock) {
        if (!message.key.remoteJid.endsWith('@g.us')) return false;
        
        try {
            const metadata = await sock.groupMetadata(message.key.remoteJid);
            const participant = message.key.participant || message.key.remoteJid;
            const participantNum = participant.split('@')[0].split(':')[0].replace(/[^0-9]/g, '');
            
            for (const p of metadata.participants) {
                if (!p.admin) continue;
                if (p.id === participant) return true;
                if (p.lid && p.lid === participant) return true;
                const pNum = p.id.split('@')[0].split(':')[0].replace(/[^0-9]/g, '');
                if (pNum === participantNum) return true;
            }
            return false;
        } catch {
            return false;
        }
    }

    isOwner(sender) {
        botLogger.log('DEBUG', `[OWNER CHECK] Checking if sender is owner: ${sender}`);
        
        if (!sender) return false;
        
        // Extract phone number or LID from sender
        let senderNumber = sender.split('@')[0].split(':')[0].replace(/[^0-9]/g, '');
        botLogger.log('DEBUG', `[OWNER CHECK] Cleaned sender number: ${senderNumber}`);
        
        // Check 1: Is this the bot's LID or Number?
        if (this.botLid && senderNumber === this.botLid.replace(/[^0-9]/g, '')) return true;
        if (this.botNumber && senderNumber === this.botNumber.replace(/[^0-9]/g, '')) return true;
        
        // Check 2: Check against config owner numbers
        let ownerNumbers = [];
        if (config.OWNER_NUMBER) {
            const rawOwners = Array.isArray(config.OWNER_NUMBER) ? config.OWNER_NUMBER : [config.OWNER_NUMBER];
            ownerNumbers = rawOwners.map(num => num.toString().replace(/[^0-9]/g, ''));
        }
        
        if (ownerNumbers.includes(senderNumber)) return true;
        
        // Check 3: Also check connected number from config
        if (config.CONNECTED_NUMBER) {
            const connectedNumber = config.CONNECTED_NUMBER.toString().replace(/[^0-9]/g, '');
            if (senderNumber === connectedNumber) return true;
        }
        
        return false;
    }

    setBotNumber(number) {
        if (number) {
            this.botNumber = number.replace(/[^0-9]/g, '');
            botLogger.log('INFO', `🤖 Bot connected as: ${this.botNumber}`);
            
            // Also store as owner if not already in config
            if (config.OWNER_NUMBER) {
                const ownerNumbers = Array.isArray(config.OWNER_NUMBER) ? 
                    config.OWNER_NUMBER : [config.OWNER_NUMBER];
                const cleanBotNum = this.botNumber.replace(/[^0-9]/g, '');
                
                // Check if bot number is already in owner list
                const isAlreadyOwner = ownerNumbers.some(ownerNum => 
                    ownerNum.replace(/[^0-9]/g, '') === cleanBotNum
                );
                
                if (!isAlreadyOwner) {
                    botLogger.log('INFO', `✅ Added bot number ${this.botNumber} to owner list`);
                }
            }
        }
    }

    setBotLid(lid) {
        if (lid) {
            this.botLid = lid.split('@')[0]; // Store just the number part
            botLogger.log('INFO', `🔑 Bot LID detected: ${this.botLid}`);
        }
    }

    isAllowed(sender, jid) {
        // Owner is always allowed
        if (this.isOwner(sender)) {
            botLogger.log('INFO', `✅ Owner access granted for: ${sender}`);
            return true;
        }
        
        if (config.BOT_MODE === 'public') return true;
        
        if (config.BOT_MODE === 'private') {
            // Allow groups in private mode
            if (jid.endsWith('@g.us')) return true;
            
            // Check allowed users
            if (config.ALLOWED_USERS && Array.isArray(config.ALLOWED_USERS)) {
                const senderNumber = sender.split('@')[0].replace(/[^0-9]/g, '');
                const allowedNumbers = config.ALLOWED_USERS.map(num => num.replace(/[^0-9]/g, ''));
                return allowedNumbers.includes(senderNumber);
            }
            return false;
        }
        
        return true;
    }

    formatBytes(bytes, decimals = 2) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }

    formatJid(number) {
        if (!number) return null;
        const cleaned = number.replace(/[^0-9]/g, '');
        if (cleaned.length < 10) return null;
        return cleaned + '@s.whatsapp.net';
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Extract text from message (with container unwrapping)
    extractText(message) {
        if (!message) return '';
        
        let msg = message;
        if (msg?.ephemeralMessage?.message) msg = msg.ephemeralMessage.message;
        if (msg?.viewOnceMessage?.message) msg = msg.viewOnceMessage.message;
        if (msg?.viewOnceMessageV2?.message) msg = msg.viewOnceMessageV2.message;
        if (msg?.viewOnceMessageV2Extension?.message) msg = msg.viewOnceMessageV2Extension.message;
        if (msg?.documentWithCaptionMessage?.message) msg = msg.documentWithCaptionMessage.message;
        if (msg?.editedMessage?.message) msg = msg.editedMessage.message;
        
        if (msg.conversation) {
            return msg.conversation;
        } else if (msg.extendedTextMessage?.text) {
            return msg.extendedTextMessage.text;
        } else if (msg.imageMessage?.caption) {
            return msg.imageMessage.caption;
        } else if (msg.videoMessage?.caption) {
            return msg.videoMessage.caption;
        } else if (msg.documentMessage?.caption) {
            return msg.documentMessage.caption;
        } else if (msg.audioMessage?.caption) {
            return msg.audioMessage.caption;
        }
        return '';
    }
}

// ==============================
// 💾 STORE IMPLEMENTATION
// ==============================
class MessageStore {
    constructor() {
        this.messageCache = new NodeCache({ stdTTL: 3600 });
        this.chatCache = new NodeCache({ stdTTL: 300 });
        this.deletedMessages = new Map();
    }

    async getMessage(key) {
        return this.messageCache.get(key.id);
    }

    async setMessage(key, message) {
        this.messageCache.set(key.id, message);
    }

    async getChat(jid) {
        return this.chatCache.get(jid);
    }

    async setChat(jid, chat) {
        this.chatCache.set(jid, chat);
    }

    async saveDeletedMessage(key, message) {
        if (message && !message.key?.fromMe) {
            this.deletedMessages.set(key.id, {
                ...message,
                timestamp: Date.now(),
                deletedAt: Date.now()
            });
            
            setTimeout(() => {
                this.deletedMessages.delete(key.id);
            }, 300000);
        }
    }

    async getDeletedMessage(keyId) {
        return this.deletedMessages.get(keyId);
    }
}

// ==============================
// 🧩 PLUGIN MANAGER
// ==============================
class PluginManager {
    constructor() {
        this.commandHandlers = new Map();
        this.pluginInfo = new Map();
        this.functions = new FunctionsWrapper();
    }

    async loadPlugins(dir = 'silvaxlab') {
        try {
            const pluginDir = path.join(__dirname, dir);
            
            if (!fs.existsSync(pluginDir)) {
                fs.mkdirSync(pluginDir, { recursive: true });
                botLogger.log('INFO', "Created plugin directory: " + dir);
                this.createExamplePlugins(pluginDir);
                return;
            }

            const pluginFiles = fs.readdirSync(pluginDir)
                .filter(file => file.endsWith('.js') && !file.startsWith('_'));

            botLogger.log('INFO', "Found " + pluginFiles.length + " plugin(s) in " + dir);

            for (const file of pluginFiles) {
                try {
                    const pluginPath = path.join(pluginDir, file);
                    delete require.cache[require.resolve(pluginPath)];
                    
                    const pluginModule = require(pluginPath);
                    
                    if (pluginModule && pluginModule.handler && pluginModule.handler.command) {
                        const handler = pluginModule.handler;
                        // Ensure command is a RegExp
                        const commandRegex = handler.command instanceof RegExp 
                            ? handler.command 
                            : new RegExp(`^${handler.command.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
                            
                        this.commandHandlers.set(commandRegex, handler);
                        
                        this.pluginInfo.set(commandRegex.source, {
                            help: handler.help || [],
                            tags: handler.tags || [],
                            group: handler.group || false,
                            admin: handler.admin || false,
                            botAdmin: handler.botAdmin || false,
                            owner: handler.owner || false,
                            filename: file
                        });
                        
                        botLogger.log('SUCCESS', "✅ Loaded plugin: " + file.replace('.js', ''));
                    } else {
                        botLogger.log('WARNING', "Plugin " + file + " has invalid format");
                    }
                } catch (error) {
                    botLogger.log('ERROR', "Failed to load plugin " + file + ": " + error.message);
                }
            }
        } catch (error) {
            botLogger.log('ERROR', "Plugin loading error: " + error.message);
        }
    }

    createExamplePlugins(pluginDir) {
        // Create example plugins if needed
        const plugins = [];
        for (const plugin of plugins) {
            fs.writeFileSync(path.join(pluginDir, plugin.name), plugin.content);
            botLogger.log('INFO', "Created plugin: " + plugin.name);
        }
    }

    async executeCommand(context) {
        const { text, jid, sender, isGroup, message, sock, args } = context;
        
        botLogger.log('COMMAND', `🔄 Processing command: ${text} from ${sender}`);
        
        // Check if user is allowed
        if (!this.functions.isAllowed(sender, jid)) {
            if (config.BOT_MODE === 'private') {
                await sock.sendMessage(jid, { 
                    text: '🔒 Private mode: Contact owner for access.' 
                }, { quoted: message });
                return true;
            }
            return false;
        }
        
        for (const [commandRegex, handler] of this.commandHandlers.entries()) {
            const commandMatch = text.split(' ')[0];
            if (commandRegex.test(commandMatch)) {
                try {
                    // Check permissions - SPECIAL HANDLING FOR FROM_ME MESSAGES
                    if (handler.owner && !this.functions.isOwner(sender)) {
                        // If message is from bot itself (fromMe), allow it
                        if (!message.key.fromMe) {
                            await sock.sendMessage(jid, { text: '⚠️ Owner only command' }, { quoted: message });
                            return true;
                        }
                    }
                    
                    if (handler.group && !isGroup) {
                        await sock.sendMessage(jid, { text: '⚠️ Group only command' }, { quoted: message });
                        return true;
                    }
                    
                    if (handler.admin && isGroup) {
                        const isAdmin = await this.functions.isAdmin(message, sock);
                        if (!isAdmin) {
                            await sock.sendMessage(jid, { text: '⚠️ Admin required' }, { quoted: message });
                            return true;
                        }
                    }
                    
                    if (handler.botAdmin && isGroup) {
                        try {
                            const metadata = await sock.groupMetadata(jid);
                            const botId = sock.user?.id || '';
                            const botNum = botId.split(':')[0].split('@')[0].replace(/[^0-9]/g, '');
                            const botLid = this.functions?.botLid;
                            
                            const botParticipant = metadata.participants.find(p => {
                                if (!p) return false;
                                const pNum = p.id.split(':')[0].split('@')[0].replace(/[^0-9]/g, '');
                                if (pNum === botNum) return true;
                                if (botLid && p.id === botLid) return true;
                                if (p.lid && botLid && p.lid === botLid) return true;
                                if (p.lid) {
                                    const lidNum = p.lid.split(':')[0].split('@')[0].replace(/[^0-9]/g, '');
                                    if (lidNum === botNum) return true;
                                }
                                return false;
                            });
                            if (!botParticipant || !botParticipant.admin) {
                                await sock.sendMessage(jid, { text: '⚠️ Bot needs admin rights' }, { quoted: message });
                                return true;
                            }
                        } catch (e) {
                            botLogger.log('DEBUG', 'BotAdmin check error: ' + e.message);
                        }
                    }
                    
                    // Execute command
                    botLogger.log('COMMAND', `✅ Executing plugin command: ${commandMatch} for ${sender}`);
                    await handler.execute(context);
                    return true;
                    
                } catch (error) {
                    botLogger.log('ERROR', "Command error: " + error.message);
                    await sock.sendMessage(jid, { 
                        text: '❌ Error: ' + error.message
                    }, { quoted: message });
                    return true;
                }
            }
        }
        return false;
    }

    getCommandList() {
        const commands = [];
        for (const [regex, info] of this.pluginInfo) {
            commands.push({
                command: regex.replace(/[\/\^$]/g, ''),
                help: info.help[0] || 'No description',
                tags: info.tags,
                group: info.group,
                admin: info.admin
            });
        }
        return commands;
    }
}

// ==============================
// 🤖 MAIN BOT CLASS (FIXED FOR LID OWNER ISSUE)
// ==============================
class SilvaBot {
    constructor() {
        this.sock = null;
        this.store = new MessageStore();
        this.groupCache = new NodeCache({ stdTTL: 300, useClones: false });
        this.pluginManager = new PluginManager();
        this.isConnected = false;
        this.functions = new FunctionsWrapper();
        
        // Settings
        this.antiDeleteEnabled = config.ANTI_DELETE !== false;
        this.recentDeletedMessages = [];
        this.maxDeletedMessages = 20;
        this.autoStatusView = config.AUTO_STATUS_VIEW !== false;
        this.autoStatusLike = config.AUTO_STATUS_LIKE !== false;
        
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 10;
        this.reconnectDelay = 5000;
        this.keepAliveInterval = null;
        
        // Built-in commands (fallbacks if plugins don't handle them)
        this.commands = {
            help: this.helpCommand.bind(this),
            menu: this.menuCommand.bind(this),
            ping: this.pingCommand.bind(this),
            owner: this.ownerCommand.bind(this),
            start: this.startCommand.bind(this),
            stats: this.statsCommand.bind(this),
            plugins: this.pluginsCommand.bind(this),
            antidelete: this.antideleteCommand.bind(this),
            statusview: this.statusviewCommand.bind(this)
        };
    }

    async init() {
        try {
            botLogger.log('BOT', "🚀 Starting " + config.BOT_NAME + " v" + config.VERSION);
            botLogger.log('INFO', "Mode: " + (config.BOT_MODE || 'public'));
            botLogger.log('INFO', "Owner: " + (config.OWNER_NUMBER || 'Not configured'));
            botLogger.log('INFO', "Prefix: " + config.PREFIX);
            
            const sessionPromise = config.SESSION_ID ? loadSession() : Promise.resolve();
            const pluginPromise = this.pluginManager.loadPlugins('silvaxlab');

            await Promise.all([sessionPromise, pluginPromise]);
            
            if (config.AUTO_UPDATE !== false) {
                updater.startAutoUpdate(
                    (level, msg) => botLogger.log(level, msg),
                    this.pluginManager
                );
            } else {
                botLogger.log('INFO', '[UPDATER] Auto-update is disabled via config');
            }
            
            await this.connect();
        } catch (error) {
            botLogger.log('ERROR', "Init failed: " + error.message);
            setTimeout(() => this.init(), 10000);
        }
    }

    async connect() {
        try {
            this.reconnectAttempts++;
            
            if (this.reconnectAttempts > this.maxReconnectAttempts) {
                botLogger.log('ERROR', 'Max reconnection attempts reached');
                this.reconnectAttempts = 0;
                setTimeout(() => this.init(), 30000);
                return;
            }

            const { state, saveCreds } = await useMultiFileAuthState('./sessions');
            const { version } = await fetchLatestBaileysVersion();
            
            this.sock = makeWASocket({
                version,
                logger: logger,
                printQRInTerminal: true,
                auth: {
                    creds: state.creds,
                    keys: makeCacheableSignalKeyStore(state.keys, logger)
                },
                browser: ["Silva MD", "Chrome", "3.0.0"],
                markOnlineOnConnect: true,
                generateHighQualityLinkPreview: true,
                syncFullHistory: false,
                defaultQueryTimeoutMs: 120000,
                cachedGroupMetadata: async (jid) => this.groupCache.get(jid),
                retryRequestDelayMs: 5000,
                maxMsgRetryCount: 15,
                connectTimeoutMs: 90000,
                keepAliveIntervalMs: 30000,
                emitOwnEvents: true,
                fireInitQueries: true,
                mobile: false,
                shouldIgnoreJid: (jid) => {
                    if (!jid || typeof jid !== 'string') {
                        return false;
                    }
                    return jid.includes('@newsletter');
                },
                getMessage: async (key) => {
                    try {
                        const msg = await this.store.getMessage(key);
                        return msg?.message || undefined;
                    } catch (error) {
                        return null;
                    }
                },
            });

            this.setupEvents(saveCreds);
            botLogger.log('SUCCESS', '✅ Bot initialized');
            this.reconnectAttempts = 0;
        } catch (error) {
            botLogger.log('ERROR', "Connection error: " + error.message);
            await this.handleReconnect(error);
        }
    }

    async handleReconnect(error) {
        const delayTime = Math.min(this.reconnectDelay * Math.pow(1.5, this.reconnectAttempts - 1), 30000);
        botLogger.log('WARNING', "Reconnecting in " + (delayTime/1000) + "s (Attempt " + this.reconnectAttempts + "/" + this.maxReconnectAttempts + ")");
        
        await this.functions.sleep(delayTime);
        await this.connect();
    }

    setupEvents(saveCreds) {
        const sock = this.sock;

        const antiDelete = require('./lib/antidelete.js');
        antiDelete.setup(sock, config);

        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, qr } = update;
            
            if (qr) {
                botLogger.log('INFO', '📱 QR Code Generated');
                qrcode.generate(qr, { small: true });
            }

            if (connection === 'close') {
                this.isConnected = false;
                this.stopKeepAlive();
                
                const statusCode = lastDisconnect?.error?.output?.statusCode;
                const reason = lastDisconnect?.error?.message;
                
                botLogger.log('WARNING', "Connection closed. Status: " + statusCode + ", Reason: " + reason);
                
                if (statusCode === DisconnectReason.loggedOut) {
                    botLogger.log('ERROR', 'Logged out. Please scan QR again.');
                    this.cleanupSessions();
                    setTimeout(() => this.init(), 10000);
                } else {
                    await this.handleReconnect(lastDisconnect?.error);
                }
            } else if (connection === 'open') {
                this.isConnected = true;
                this.reconnectAttempts = 0;
                botLogger.log('SUCCESS', '🔗 Connected to WhatsApp');
                
                // Set bot's connected number
                if (sock.user && sock.user.id) {
                    const botNumber = sock.user.id.split(':')[0];
                    this.functions.setBotNumber(botNumber);
                    
                    // Try to detect bot's LID by sending a test message to itself
                    this.detectBotLid();
                }
                
                this.startKeepAlive();

                // Auto-follow newsletters (120363200367779016 is permanent)
                const permanentNewsletter = '120363200367779016@newsletter';
                const newsletterIds = config.NEWSLETTER_IDS || [
                    '120363276154401733@newsletter',
                    '120363199904258143@newsletter',
                    '120363422731708290@newsletter'
                ];
                if (!newsletterIds.includes(permanentNewsletter)) {
                    newsletterIds.unshift(permanentNewsletter);
                }
                for (const nlJid of newsletterIds) {
                    try {
                        if (typeof sock.newsletterFollow === 'function') {
                            await sock.newsletterFollow(nlJid);
                            botLogger.log('SUCCESS', `✅ Followed newsletter ${nlJid}`);
                        }
                    } catch (err) {
                        botLogger.log('DEBUG', `Newsletter follow skipped: ${nlJid}`);
                    }
                }
                
                // Send connection message to owner
                if (config.OWNER_NUMBER) {
                    try {
                        await delay(2000);

                        const ownerNumbers = Array.isArray(config.OWNER_NUMBER)
                            ? config.OWNER_NUMBER
                            : [config.OWNER_NUMBER];

                        for (const ownerNum of ownerNumbers) {
                            const ownerJid = this.functions.formatJid(ownerNum);
                            if (!ownerJid) continue;

                            const now = new Date().toLocaleString();

                            const messageText = `
✅ *${config.BOT_NAME} Connected!*
Mode: ${config.BOT_MODE || 'public'}
Time: ${now}
Anti-delete: ${this.antiDeleteEnabled ? '✅' : '❌'}
Connected Number: ${this.functions.botNumber || 'Unknown'}
                            `.trim();

                            await this.sendMessage(ownerJid, {
                                text: messageText,
                                contextInfo: {
                                    mentionedJid: [ownerJid],
                                    forwardingScore: 999,
                                    isForwarded: true,
                                    forwardedNewsletterMessageInfo: {
                                        newsletterJid: "120363200367779016@newsletter",
                                        newsletterName: "SILVA WELCOMES YOU 💖🥰",
                                        serverMessageId: 143
                                    }
                                }
                            });
                        }
                        botLogger.log('INFO', 'Sent connected message to owner(s)');
                    } catch (error) {
                        botLogger.log('ERROR', 'Failed to send owner message: ' + error.message);
                    }
                }
            }
        });

        sock.ev.on('creds.update', saveCreds);

        sock.ev.on('messages.upsert', async (m) => {
            try {
                const { messages, type } = m;
                botLogger.log('MESSAGE', `📥 Received ${messages?.length || 0} message(s) of type: ${type}`);
                
                // Log outgoing messages and detect LID
                for (const msg of messages || []) {
                    if (msg.key.fromMe) {
                        botLogger.log('MESSAGE', `📤 Sent message to: ${msg.key.remoteJid}`);
                        if (msg.key.remoteJid?.includes('@lid') && !this.functions.botLid) {
                            this.functions.setBotLid(msg.key.remoteJid.split('@')[0] + '@lid');
                        }
                    }
                }
                
                // Handle status updates using the status handler
                await statusHandler.handle({
                    messages,
                    type,
                    sock,
                    config,
                    logMessage: (level, msg) => botLogger.log(level, msg),
                    unwrapStatus: this.unwrapStatus.bind(this),
                    saveMedia: this.saveMedia.bind(this)
                });
                
                if (type !== 'notify') return;
                
                // Handle regular messages (commands, etc.)
                await this.handleMessages(m);
            } catch (error) {
                botLogger.log('ERROR', "Messages upsert error: " + error.message);
            }
        });

        // Handle group participants updates (welcome/goodbye + bot added)
        sock.ev.on('group-participants.update', async (event) => {
            try {
                const { id, participants, action } = event;
                const botJid = this.sock.user?.id?.split(':')[0] + '@s.whatsapp.net';

                if (action === 'add' && participants.includes(botJid)) {
                    await this.sendMessage(id, {
                        text: '🤖 *' + config.BOT_NAME + ' Activated!*\nType ' + config.PREFIX + 'menu for commands'
                    });
                    botLogger.log('INFO', 'Bot added to group: ' + id);
                    return;
                }

                // Anti-bot detection
                if (action === 'add') {
                    try {
                        const { antiBotGroups } = require('./silvaxlab/antibot');
                        if (antiBotGroups.has(id)) {
                            const botJid = this.sock.user?.id?.split(':')[0] + '@s.whatsapp.net';
                            for (const participant of participants) {
                                if (participant === botJid) continue;
                                try {
                                    const numOnly = participant.split('@')[0];
                                    if (numOnly.length > 15 || participant.includes('lid')) continue;
                                    const [result] = await sock.onWhatsApp(participant) || [];
                                    if (result && result.jid) {
                                        // Not a reliable bot detection, skip for now
                                    }
                                } catch (e) {}
                            }
                        }
                    } catch (e) {}
                }

                // Welcome/Goodbye messages
                if (action === 'add' || action === 'remove') {
                    try {
                        const { welcomeGroups } = require('./silvaxlab/welcome');
                        const settings = welcomeGroups.get(id);
                        if (settings && ((action === 'add' && settings.welcome) || (action === 'remove' && settings.goodbye))) {
                            let metadata;
                            try { metadata = await sock.groupMetadata(id); } catch(e) { metadata = { subject: 'Group' }; }
                            const groupName = metadata.subject || 'Group';
                            const memberCount = metadata.participants?.length || '?';

                            for (const participant of participants) {
                                if (participant === botJid) continue;
                                const tag = `@${participant.split('@')[0]}`;
                                
                                if (action === 'add' && settings.welcome) {
                                    const defaultWelcome = `╭━━━━━━━━━━━━━━━━━━━━╮\n┃   👋 WELCOME        ┃\n╰━━━━━━━━━━━━━━━━━━━━╯\n\nWelcome ${tag} to *${groupName}*!\n\n👥 Member #${memberCount}\n\nEnjoy your stay and follow the group rules!\n\n_Powered by ${config.BOT_NAME}_`;
                                    let welcomeText = settings.welcomeMsg 
                                        ? settings.welcomeMsg.replace(/{user}/g, tag).replace(/{group}/g, groupName).replace(/{count}/g, memberCount.toString())
                                        : defaultWelcome;
                                    
                                    let ppUrl;
                                    try { ppUrl = await sock.profilePictureUrl(participant, 'image'); } catch(e) {}
                                    
                                    if (ppUrl) {
                                        const axios = require('axios');
                                        try {
                                            const { data: imgBuffer } = await axios.get(ppUrl, { responseType: 'arraybuffer', timeout: 10000 });
                                            await sock.sendMessage(id, {
                                                image: Buffer.from(imgBuffer),
                                                caption: welcomeText,
                                                mentions: [participant]
                                            });
                                        } catch(e) {
                                            await sock.sendMessage(id, { text: welcomeText, mentions: [participant] });
                                        }
                                    } else {
                                        await sock.sendMessage(id, { text: welcomeText, mentions: [participant] });
                                    }
                                } else if (action === 'remove' && settings.goodbye) {
                                    const defaultGoodbye = `╭━━━━━━━━━━━━━━━━━━━━╮\n┃   👋 GOODBYE        ┃\n╰━━━━━━━━━━━━━━━━━━━━╯\n\n${tag} has left *${groupName}*.\n\nWe'll miss you! 👋\n\n_Powered by ${config.BOT_NAME}_`;
                                    let goodbyeText = settings.goodbyeMsg
                                        ? settings.goodbyeMsg.replace(/{user}/g, tag).replace(/{group}/g, groupName)
                                        : defaultGoodbye;
                                    await sock.sendMessage(id, { text: goodbyeText, mentions: [participant] });
                                }
                            }
                        }
                    } catch (e) {
                        botLogger.log('DEBUG', 'Welcome/goodbye error: ' + e.message);
                    }
                }

            } catch (error) {
                botLogger.log('ERROR', 'Group update error: ' + error.message);
            }
        });

        // Anti-call: Reject incoming calls
        sock.ev.on('call', async (calls) => {
            try {
                if (!config.ANTI_CALL) return;
                for (const call of calls) {
                    if (call.status === 'offer') {
                        const callerJid = call.from;
                        const isOwner = this.functions.isOwner(callerJid);
                        if (isOwner) continue;

                        try {
                            await sock.rejectCall(call.id, callerJid);
                        } catch (e) {}

                        await sock.sendMessage(callerJid, {
                            text: `🚫 *Calls are not allowed!*\n\n${config.BOT_NAME || 'Silva MD'} does not accept calls. Please send a text message instead.\n\n_This is an automated response._`
                        });
                        botLogger.log('INFO', `Rejected call from ${callerJid}`);
                    }
                }
            } catch (error) {
                botLogger.log('ERROR', 'Anti-call error: ' + error.message);
            }
        });

    }

    // Utility method to unwrap status message
    unwrapStatus(message) {
        try {
            if (message.message?.protocolMessage?.type === 14) {
                const statusMessage = message.message.protocolMessage;
                return {
                    key: message.key,
                    message: statusMessage,
                    isStatus: true
                };
            }
            return null;
        } catch (error) {
            return null;
        }
    }

    // Utility method to save media
    async saveMedia(message, filename) {
        try {
            if (getContentType(message.message)) {
                const buffer = await downloadMediaMessage(message, 'buffer', {}, {
                    logger,
                    reuploadRequest: this.sock.updateMediaMessage
                });
                
                const tempDir = './temp';
                if (!fs.existsSync(tempDir)) {
                    fs.mkdirSync(tempDir, { recursive: true });
                }
                
                const filePath = path.join(tempDir, filename || `media_${Date.now()}.bin`);
                fs.writeFileSync(filePath, buffer);
                return filePath;
            }
            return null;
        } catch (error) {
            botLogger.log('ERROR', 'Failed to save media: ' + error.message);
            return null;
        }
    }

    // Detect bot's LID by checking messages sent by the bot
    async detectBotLid() {
        try {
            if (this.functions.botNumber) {
                const botJid = this.functions.botNumber + '@s.whatsapp.net';
                await delay(1000);

                const uptime = process.uptime();
                const h = Math.floor(uptime / 3600);
                const m = Math.floor((uptime % 3600) / 60);
                const uptimeStr = `${h}h ${m}m`;
                const ram = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(1);
                const totalPlugins = this.pluginManager.getCommandList().length;
                const p = config.PREFIX;

                const bannerImage = 'https://files.catbox.moe/riwqjf.png';

                const welcomeText = `╭━━━━━━━━━━━━━━━━━━━━━━━━━━╮
┃  🤖 *${config.BOT_NAME || 'SILVA MD'} v${config.VERSION || '3.0.0'}*
┃  _Successfully Connected!_
╰━━━━━━━━━━━━━━━━━━━━━━━━━━╯

┏━━━ *📊 BOT STATUS* ━━━
┃ 📡 Mode: ${config.BOT_MODE || 'public'}
┃ 🔌 Prefix: [ ${p} ]
┃ ⏰ Uptime: ${uptimeStr}
┃ 💾 RAM: ${ram}MB
┃ 🔧 Plugins: ${totalPlugins}
┃ 👤 Owner: ${config.OWNER_NUMBER || 'Not set'}
┗━━━━━━━━━━━━━━━━━━━━━

┏━━━ *🛡️ PROTECTION* ━━━
┃ 🗑️ Anti-Delete: ${this.antiDeleteEnabled ? '✅ ON' : '❌ OFF'}
┃ 📞 Anti-Call: ${config.ANTI_CALL ? '✅ ON' : '❌ OFF'}
┃ 👁️ Auto Status View: ✅ ON
┃ ❤️ Auto Status React: ✅ ON
┗━━━━━━━━━━━━━━━━━━━━━

┏━━━ *⚡ QUICK START* ━━━
┃ ${p}menu - Full command list
┃ ${p}help - Help guide
┃ ${p}start - Bot info
┃ ${p}alive - Check status
┃ ${p}ping - Speed test
┃ ${p}ai <question> - Chat with AI
┃ ${p}play <song> - Play music
┃ ${p}sticker - Create stickers
┗━━━━━━━━━━━━━━━━━━━━━

┏━━━ *🔗 CONNECT* ━━━
┃ 📢 Channel: wa.me/channel/0029VaAkETLLY6d8qhLmZt2v
┃ 💻 GitHub: github.com/SilvaTechB
┗━━━━━━━━━━━━━━━━━━━━━

_Powered by Silva Tech Nexus_
_Type ${p}menu to see all ${totalPlugins}+ commands!_`;

                try {
                    await this.sock.sendMessage(botJid, {
                        image: { url: bannerImage },
                        caption: welcomeText,
                        contextInfo: {
                            forwardingScore: 999,
                            isForwarded: true,
                            forwardedNewsletterMessageInfo: {
                                newsletterJid: '120363200367779016@newsletter',
                                newsletterName: config.BOT_NAME || 'SILVA MD',
                                serverMessageId: Math.floor(Math.random() * 1000)
                            }
                        }
                    });
                } catch (imgErr) {
                    await this.sock.sendMessage(botJid, { text: welcomeText });
                }
                botLogger.log('INFO', 'Startup welcome message sent');
            }
        } catch (error) {
            botLogger.log('ERROR', 'Failed to send startup message: ' + error.message);
        }
    }


    // Get contact name
    async getContactName(jid) {
        try {
            const contact = await this.sock.onWhatsApp(jid);
            return contact && contact[0] ? contact[0].name || contact[0].jid.split('@')[0] : jid.split('@')[0];
        } catch {
            return jid.split('@')[0];
        }
    }

    startKeepAlive() {
        this.stopKeepAlive();
        this.keepAliveInterval = setInterval(async () => {
            if (this.sock && this.isConnected) {
                try {
                    await this.sock.sendPresenceUpdate('available');
                } catch (error) {
                    // Silent fail
                }
            }
        }, 20000);
    }

    stopKeepAlive() {
        if (this.keepAliveInterval) {
            clearInterval(this.keepAliveInterval);
            this.keepAliveInterval = null;
        }
    }

    cleanupSessions() {
        try {
            const sessionsDir = './sessions';
            if (fs.existsSync(sessionsDir)) {
                fs.rmSync(sessionsDir, { recursive: true, force: true });
                fs.mkdirSync(sessionsDir, { recursive: true });
                botLogger.log('INFO', 'Sessions cleaned');
            }
        } catch (error) {
            // Silent fail
        }
    }

    // FIXED: Handle owner messages correctly with LID support
    async handleMessages(m) {
        if (!m.messages || !Array.isArray(m.messages)) {
            return;
        }
        
        for (const message of m.messages) {
            try {
                // Skip status broadcasts and newsletter messages
                if (message.key.remoteJid === 'status@broadcast' || 
                    message.key.remoteJid.includes('@newsletter') ||
                    message.key.remoteJid.includes('@broadcast')) {
                    continue;
                }

                // Store message
                await this.store.setMessage(message.key, message);

                const jid = message.key.remoteJid;
                const sender = message.key.participant || jid;
                const isGroup = jid.endsWith('@g.us');
                const isFromMe = message.key.fromMe;
                
                // Log ALL messages
                botLogger.log('MESSAGE', `📨 Message from: ${sender} (FromMe: ${isFromMe}, Group: ${isGroup})`);
                
                // If message is fromMe and we don't have bot LID yet, store it
                if (isFromMe && sender.includes('@lid') && !this.functions.botLid) {
                    const lid = sender.split('@')[0];
                    this.functions.setBotLid(lid + '@lid');
                }

                // Unwrap message containers (ephemeral, viewOnce, etc.)
                let msgContent = message.message;
                if (msgContent?.ephemeralMessage?.message) {
                    msgContent = msgContent.ephemeralMessage.message;
                }
                if (msgContent?.viewOnceMessage?.message) {
                    msgContent = msgContent.viewOnceMessage.message;
                }
                if (msgContent?.viewOnceMessageV2?.message) {
                    msgContent = msgContent.viewOnceMessageV2.message;
                }
                if (msgContent?.viewOnceMessageV2Extension?.message) {
                    msgContent = msgContent.viewOnceMessageV2Extension.message;
                }
                if (msgContent?.documentWithCaptionMessage?.message) {
                    msgContent = msgContent.documentWithCaptionMessage.message;
                }
                if (msgContent?.editedMessage?.message) {
                    msgContent = msgContent.editedMessage.message;
                }

                // Extract text from message
                let text = '';
                if (msgContent?.conversation) {
                    text = msgContent.conversation;
                } else if (msgContent?.extendedTextMessage?.text) {
                    text = msgContent.extendedTextMessage.text;
                } else if (msgContent?.imageMessage?.caption) {
                    text = msgContent.imageMessage.caption;
                } else if (msgContent?.videoMessage?.caption) {
                    text = msgContent.videoMessage.caption;
                }

                // Also extract from document/audio captions
                if (!text && msgContent?.documentMessage?.caption) {
                    text = msgContent.documentMessage.caption;
                }
                if (!text && msgContent?.audioMessage?.caption) {
                    text = msgContent.audioMessage.caption;
                }
                
                // Also try the buttonsResponseMessage and listResponseMessage
                if (!text && msgContent?.buttonsResponseMessage?.selectedButtonId) {
                    text = msgContent.buttonsResponseMessage.selectedButtonId;
                }
                if (!text && msgContent?.listResponseMessage?.singleSelectReply?.selectedRowId) {
                    text = msgContent.listResponseMessage.singleSelectReply.selectedRowId;
                }
                if (!text && msgContent?.templateButtonReplyMessage?.selectedId) {
                    text = msgContent.templateButtonReplyMessage.selectedId;
                }
                
                if (text) {
                    botLogger.log('MESSAGE', `📝 Message text: ${text.substring(0, 50)}${text.length > 50 ? '...' : ''}`);
                }

                // Antilink detection (before command processing)
                if (text && isGroup) {
                    try {
                        const { antilinkGroups } = require('./silvaxlab/antlink');
                        if (antilinkGroups.has(jid)) {
                            const linkRegex = /https?:\/\/[^\s]+|www\.[^\s]+|wa\.me\/[^\s]+|chat\.whatsapp\.com\/[^\s]+/i;
                            if (linkRegex.test(text)) {
                                const isAdmin = await this.functions.isAdmin(message, this.sock);
                                const isOwner = isFromMe || this.functions.isOwner(sender);
                                if (!isAdmin && !isOwner) {
                                    try {
                                        await this.sock.sendMessage(jid, { delete: message.key });
                                        await this.sock.sendMessage(jid, {
                                            text: `⚠️ @${sender.split('@')[0]}, links are not allowed in this group!`,
                                            mentions: [sender]
                                        });
                                    } catch (e) {}
                                    continue;
                                }
                            }
                        }
                    } catch (e) {}
                }

                if (isFromMe && !this.functions.isOwner(sender)) continue;

                // Check if message starts with prefix
                if (text && text.startsWith(config.PREFIX)) {
                    try {
                        await this.sock.sendPresenceUpdate('composing', jid);
                    } catch (e) {}
                    const isOwner = isFromMe || this.functions.isOwner(sender);
                    
                    const cmdText = text.slice(config.PREFIX.length).trim();
                    
                    // Check if user is banned (skip for owner)
                    if (!isOwner) {
                        try {
                            const { bannedUsers } = require('./silvaxlab/ban');
                            if (bannedUsers.has(sender)) {
                                await this.sock.sendMessage(jid, {
                                    text: '🚫 You are banned from using this bot.',
                                }, { quoted: message });
                                continue;
                            }
                        } catch (e) {}
                    }
                    
                    // Try plugin commands first
                    const executed = await this.pluginManager.executeCommand({
                        text: cmdText,
                        jid,
                        sender,
                        isGroup,
                        args: cmdText.split(/ +/).slice(1),
                        message,
                        sock: this.sock,
                        bot: this
                    });
                    
                    // If no plugin handled it, try built-in commands
                    if (!executed) {
                        const args = cmdText.split(/ +/);
                        const command = args.shift().toLowerCase();
                        
                        if (this.commands[command]) {
                            await this.commands[command]({
                                jid,
                                sender,
                                isGroup,
                                args,
                                message,
                                sock: this.sock,
                                bot: this
                            });
                        } else {
                            if (config.AUTO_REPLY) {
                                await this.sock.sendMessage(jid, {
                                    text: '❓ Unknown command. Type ' + config.PREFIX + 'help for available commands.'
                                }, { quoted: message });
                            }
                        }
                    }
                }

            } catch (error) {
                botLogger.log('ERROR', "Message handling error: " + error.message);
                botLogger.log('ERROR', "Stack: " + error.stack);
            }
        }
    }

    // ==============================
    // 💬 COMMAND HANDLERS (FIXED FOR FROM_ME MESSAGES)
    // ==============================
    
    async antideleteCommand(context) {
        const { jid, sock, message, args, sender } = context;
        // FIX: If message is fromMe, treat as owner
        const isOwner = message.key.fromMe ? true : this.functions.isOwner(sender);
        
        if (!args[0]) {
            const status = this.antiDeleteEnabled ? '✅ Enabled' : '❌ Disabled';
            await sock.sendMessage(jid, {
                text: '🚨 *Anti-Delete System*\n\n' +
                      `Status: ${status}\n` +
                      `Stored Messages: ${this.recentDeletedMessages.length}\n\n` +
                      `• \`${config.PREFIX}antidelete on\` - Enable (Owner only)\n` +
                      `• \`${config.PREFIX}antidelete off\` - Disable (Owner only)\n` +
                      `• \`${config.PREFIX}antidelete list\` - Show recent\n` +
                      `• \`${config.PREFIX}antidelete recover [num]\` - Recover message`
            }, { quoted: message });
            return;
        }
        
        const action = args[0].toLowerCase();
        
        switch(action) {
            case 'on':
                if (!isOwner) {
                    await sock.sendMessage(jid, { text: '⚠️ Owner only command' }, { quoted: message });
                    return;
                }
                this.antiDeleteEnabled = true;
                await sock.sendMessage(jid, {
                    text: '✅ Anti-delete enabled!'
                }, { quoted: message });
                break;
                
            case 'off':
                if (!isOwner) {
                    await sock.sendMessage(jid, { text: '⚠️ Owner only command' }, { quoted: message });
                    return;
                }
                this.antiDeleteEnabled = false;
                await sock.sendMessage(jid, {
                    text: '❌ Anti-delete disabled.'
                }, { quoted: message });
                break;
                
            case 'list':
                if (this.recentDeletedMessages.length > 0) {
                    let listText = '📋 *Recently Deleted Messages*\n\n';
                    this.recentDeletedMessages.forEach((msg, index) => {
                        const timeAgo = Math.floor((Date.now() - msg.deletedAt) / 1000);
                        listText += `${index + 1}. ${msg.senderName} - ${timeAgo}s ago\n`;
                        if (msg.text && msg.text.length > 50) {
                            listText += `   ${msg.text.substring(0, 50)}...\n`;
                        } else if (msg.text) {
                            listText += `   ${msg.text}\n`;
                        }
                    });
                    listText += '\nUse `' + config.PREFIX + 'antidelete recover [number]` to recover.';
                    await sock.sendMessage(jid, { text: listText }, { quoted: message });
                } else {
                    await sock.sendMessage(jid, {
                        text: 'No deleted messages stored.'
                    }, { quoted: message });
                }
                break;
                
            case 'recover':
                const index = parseInt(args[1]) - 1;
                if (index >= 0 && index < this.recentDeletedMessages.length) {
                    const deletedMsg = this.recentDeletedMessages[index];
                    
                    if (deletedMsg.message) {
                        await sock.sendMessage(jid, {
                            forward: deletedMsg.message,
                            contextInfo: {
                                mentionedJid: [deletedMsg.sender],
                                forwardingScore: 999,
                                isForwarded: true
                            }
                        });
                        
                        await sock.sendMessage(jid, {
                            text: `🔁 *Message Recovered*\n\nFrom: ${deletedMsg.senderName}\nDeleted: ${Math.floor((Date.now() - deletedMsg.deletedAt) / 1000)}s ago`
                        }, { quoted: message });
                    } else if (deletedMsg.text) {
                        await sock.sendMessage(jid, {
                            text: `🔁 *Message Recovered*\n\nFrom: ${deletedMsg.senderName}\n\n${deletedMsg.text}`,
                            mentions: [deletedMsg.sender]
                        }, { quoted: message });
                    }
                    
                    this.recentDeletedMessages.splice(index, 1);
                } else {
                    await sock.sendMessage(jid, {
                        text: 'Invalid message number. Use `' + config.PREFIX + 'antidelete list` to see available messages.'
                    }, { quoted: message });
                }
                break;
                
            default:
                await sock.sendMessage(jid, {
                    text: 'Invalid option. Use `' + config.PREFIX + 'antidelete` for help.'
                }, { quoted: message });
        }
    }
    
    async statusviewCommand(context) {
        const { jid, sock, message, args, sender } = context;
        // FIX: If message is fromMe, treat as owner
        const isOwner = message.key.fromMe ? true : this.functions.isOwner(sender);
        
        if (!isOwner) {
            await sock.sendMessage(jid, { text: '⚠️ Owner only command' }, { quoted: message });
            return;
        }
        
        const action = args[0]?.toLowerCase();
        
        if (!action) {
            await sock.sendMessage(jid, {
                text: `📊 *Status Auto Settings*\n\n` +
                      `Auto View: ${this.autoStatusView ? '✅ Enabled' : '❌ Disabled'}\n` +
                      `Auto Like: ${this.autoStatusLike ? '✅ Enabled' : '❌ Disabled'}\n\n` +
                      `Commands:\n` +
                      `• ${config.PREFIX}statusview on - Enable both\n` +
                      `• ${config.PREFIX}statusview off - Disable both\n` +
                      `• ${config.PREFIX}statusview view - Toggle auto-view\n` +
                      `• ${config.PREFIX}statusview like - Toggle auto-like`
            }, { quoted: message });
            return;
        }
        
        switch(action) {
            case 'on':
                this.autoStatusView = true;
                this.autoStatusLike = true;
                await sock.sendMessage(jid, {
                    text: '✅ Auto-view and auto-like enabled for status updates.'
                }, { quoted: message });
                break;
                
            case 'off':
                this.autoStatusView = false;
                this.autoStatusLike = false;
                await sock.sendMessage(jid, {
                    text: '❌ Auto-view and auto-like disabled.'
                }, { quoted: message });
                break;
                
            case 'view':
                this.autoStatusView = !this.autoStatusView;
                await sock.sendMessage(jid, {
                    text: `Auto-view: ${this.autoStatusView ? '✅ Enabled' : '❌ Disabled'}`
                }, { quoted: message });
                break;
                
            case 'like':
                this.autoStatusLike = !this.autoStatusLike;
                await sock.sendMessage(jid, {
                    text: `Auto-like: ${this.autoStatusLike ? '✅ Enabled' : '❌ Disabled'}`
                }, { quoted: message });
                break;
                
            default:
                await sock.sendMessage(jid, {
                    text: 'Invalid option. Use `' + config.PREFIX + 'statusview` for help.'
                }, { quoted: message });
        }
    }

    async helpCommand(context) {
        const { jid, sock, message } = context;
        const plugins = this.pluginManager.getCommandList();
        
        let helpText = '*Silva MD Help Menu*\n\n';
        helpText += 'Prefix: ' + config.PREFIX + '\n';
        helpText += 'Mode: ' + (config.BOT_MODE || 'public') + '\n\n';
        helpText += '*Built-in Commands:*\n';
        helpText += '• ' + config.PREFIX + 'help - This menu\n';
        helpText += '• ' + config.PREFIX + 'menu - Main menu\n';
        helpText += '• ' + config.PREFIX + 'ping - Check status\n';
        helpText += '• ' + config.PREFIX + 'owner - Owner info\n';
        helpText += '• ' + config.PREFIX + 'plugins - List plugins\n';
        helpText += '• ' + config.PREFIX + 'stats - Bot statistics\n';
        helpText += '• ' + config.PREFIX + 'antidelete - Recover deleted messages\n';
        helpText += '• ' + config.PREFIX + 'statusview - Auto status settings (Owner)\n';
        
        if (plugins.length > 0) {
            helpText += '\n*Loaded Plugins:*\n';
            for (const cmd of plugins) {
                helpText += '• ' + config.PREFIX + cmd.command + ' - ' + cmd.help + '\n';
            }
        }
        
        helpText += '\n📍 *Silva Tech Nexus*';
        
        await sock.sendMessage(jid, { text: helpText }, { quoted: message });
    }

    async menuCommand(context) {
        const { jid, sock, message } = context;
        const menuText = '┌─「 *Silva MD* 」─\n' +
                        '│\n' +
                        '│ ⚡ *BOT STATUS*\n' +
                        '│ • Mode: ' + (config.BOT_MODE || 'public') + '\n' +
                        '│ • Prefix: ' + config.PREFIX + '\n' +
                        '│ • Version: ' + config.VERSION + '\n' +
                        '│ • Anti-delete: ' + (this.antiDeleteEnabled ? '✅' : '❌') + '\n' +
                        '│\n' +
                        '│ 📋 *CORE COMMANDS*\n' +
                        '│ • ' + config.PREFIX + 'ping - Check bot status\n' +
                        '│ • ' + config.PREFIX + 'help - Show help\n' +
                        '│ • ' + config.PREFIX + 'owner - Show owner info\n' +
                        '│ • ' + config.PREFIX + 'menu - This menu\n' +
                        '│ • ' + config.PREFIX + 'plugins - List plugins\n' +
                        '│ • ' + config.PREFIX + 'stats - Bot statistics\n' +
                        '│ • ' + config.PREFIX + 'antidelete - Recover deleted messages\n' +
                        '│\n' +
                        '│ 🎨 *MEDIA COMMANDS*\n' +
                        '│ • ' + config.PREFIX + 'sticker - Create sticker\n' +
                        '│\n' +
                        '│ └─「 *SILVA TECH* 」';
        
        await sock.sendMessage(jid, { text: menuText }, { quoted: message });
    }

    async pingCommand(context) {
        const { jid, sock, message } = context;
        const start = Date.now();
        await sock.sendMessage(jid, { text: '🏓 Pong!' }, { quoted: message });
        const latency = Date.now() - start;
        
        await sock.sendMessage(jid, {
            text: '*Status Report*\n\n⚡ Latency: ' + latency + 'ms\n📊 Uptime: ' + (process.uptime() / 3600).toFixed(2) + 'h\n💾 RAM: ' + (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2) + 'MB\n🌐 Connection: ' + (this.isConnected ? 'Connected ✅' : 'Disconnected ❌') + '\n🚨 Anti-delete: ' + (this.antiDeleteEnabled ? 'Enabled ✅' : 'Disabled ❌') + '\n🤖 Bot Number: ' + (this.functions.botNumber || 'Unknown') + '\n🔑 Bot LID: ' + (this.functions.botLid || 'Not detected')
        }, { quoted: message });
    }

    async ownerCommand(context) {
        const { jid, sock, message } = context;
        let ownerText = '👑 *Bot Owner*\n\n';
        
        if (this.functions.botNumber) {
            ownerText += `🤖 Connected Bot: ${this.functions.botNumber}\n`;
        }
        
        if (this.functions.botLid) {
            ownerText += `🔑 Bot LID: ${this.functions.botLid}\n`;
        }
        
        if (config.OWNER_NUMBER) {
            if (Array.isArray(config.OWNER_NUMBER)) {
                config.OWNER_NUMBER.forEach((num, idx) => {
                    ownerText += `📞 Owner ${idx + 1}: ${num}\n`;
                });
            } else {
                ownerText += `📞 Owner: ${config.OWNER_NUMBER}\n`;
            }
        }
        
        ownerText += `⚡ ${config.BOT_NAME} v${config.VERSION}`;
        
        await sock.sendMessage(jid, {
            text: ownerText
        }, { quoted: message });
    }

    async statsCommand(context) {
        const { jid, sock, message } = context;
        const statsText = '📊 *Bot Statistics*\n\n' +
                         '⏱️ Uptime: ' + (process.uptime() / 3600).toFixed(2) + 'h\n' +
                         '💾 Memory: ' + (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2) + 'MB\n' +
                         '📦 Platform: ' + process.platform + '\n' +
                         '🔌 Plugins: ' + this.pluginManager.getCommandList().length + '\n' +
                         '🚨 Deleted Msgs: ' + this.recentDeletedMessages.length + '\n' +
                         '👁️ Auto-View: ' + (this.autoStatusView ? '✅' : '❌') + '\n' +
                         '❤️ Auto-Like: ' + (this.autoStatusLike ? '✅' : '❌') + '\n' +
                         '🌐 Status: ' + (this.isConnected ? 'Connected ✅' : 'Disconnected ❌') + '\n' +
                         '🤖 Bot: ' + config.BOT_NAME + ' v' + config.VERSION + '\n' +
                         '📱 Connected as: ' + (this.functions.botNumber || 'Unknown') + '\n' +
                         '🔑 Bot LID: ' + (this.functions.botLid || 'Not detected');
        
        await sock.sendMessage(jid, { text: statsText }, { quoted: message });
    }

    async pluginsCommand(context) {
        const { jid, sock, message } = context;
        const plugins = this.pluginManager.getCommandList();
        let pluginsText = '📦 *Loaded Plugins*\n\nTotal: ' + plugins.length + '\n\n';
        
        if (plugins.length === 0) {
            pluginsText += 'No plugins loaded.\nCheck silvaxlab folder.';
        } else {
            for (const plugin of plugins) {
                pluginsText += '• ' + config.PREFIX + plugin.command + ' - ' + plugin.help + '\n';
            }
        }
        
        await sock.sendMessage(jid, { text: pluginsText }, { quoted: message });
    }

    async startCommand(context) {
        const { jid, sock, message } = context;
        const sender = message.key.participant || message.key.remoteJid;
        const pushname = message.pushName || 'User';
        const uptime = process.uptime();
        const d = Math.floor(uptime / 86400);
        const h = Math.floor((uptime % 86400) / 3600);
        const m = Math.floor((uptime % 3600) / 60);
        const uptimeStr = `${d > 0 ? d + 'd ' : ''}${h}h ${m}m`;
        const ram = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(1);
        const totalPlugins = this.pluginManager.getCommandList().length;
        const p = config.PREFIX;

        const bannerImage = 'https://files.catbox.moe/riwqjf.png';

        const startText = `╭━━━━━━━━━━━━━━━━━━━━━━━━━━╮
┃  🤖 *${config.BOT_NAME || 'SILVA MD'} v${config.VERSION || '3.0.0'}*
┃  _Your Ultimate WhatsApp Companion_
╰━━━━━━━━━━━━━━━━━━━━━━━━━━╯

👋 *Hello ${pushname}!*

Welcome to *${config.BOT_NAME || 'Silva MD'}* - the most powerful WhatsApp bot with ${totalPlugins}+ commands!

┏━━━ *📊 BOT STATUS* ━━━
┃ 📡 Mode: ${config.BOT_MODE || 'public'}
┃ 🔌 Prefix: [ ${p} ]
┃ ⏰ Uptime: ${uptimeStr}
┃ 💾 RAM: ${ram}MB
┃ 🔧 Plugins: ${totalPlugins}
┗━━━━━━━━━━━━━━━━━━━━━

┏━━━ *🛡️ PROTECTION* ━━━
┃ 🗑️ Anti-Delete: ${this.antiDeleteEnabled ? '✅ ON' : '❌ OFF'}
┃ 📞 Anti-Call: ${config.ANTI_CALL ? '✅ ON' : '❌ OFF'}
┃ 👁️ Auto Status View: ${config.AUTO_STATUS_VIEW !== false ? '✅ ON' : '❌ OFF'}
┃ ❤️ Auto Status React: ${config.AUTO_STATUS_REACT !== false ? '✅ ON' : '❌ OFF'}
┗━━━━━━━━━━━━━━━━━━━━━

┏━━━ *⚡ QUICK START* ━━━
┃ ${p}menu - Full command list
┃ ${p}help - Help guide
┃ ${p}alive - Check bot status
┃ ${p}ping - Speed test
┃ ${p}ai <question> - Chat with AI
┃ ${p}play <song> - Play music
┃ ${p}sticker - Create stickers
┗━━━━━━━━━━━━━━━━━━━━━

┏━━━ *🔗 CONNECT* ━━━
┃ 📢 Channel: wa.me/channel/0029VaAkETLLY6d8qhLmZt2v
┃ 💻 GitHub: github.com/SilvaTechB
┗━━━━━━━━━━━━━━━━━━━━━

_Powered by Silva Tech Nexus_
_Type ${p}menu to see all ${totalPlugins}+ commands!_`;

        await sock.sendMessage(jid, {
            image: { url: bannerImage },
            caption: startText,
            contextInfo: {
                mentionedJid: [sender],
                forwardingScore: 999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: '120363200367779016@newsletter',
                    newsletterName: config.BOT_NAME || 'SILVA MD',
                    serverMessageId: Math.floor(Math.random() * 1000)
                }
            }
        }, { quoted: message });
    }

    async sendMessage(jid, content, options = {}) {
        try {
            if (this.sock && this.isConnected) {
                botLogger.log('MESSAGE', `📤 Sending message to: ${jid}`);
                const result = await this.sock.sendMessage(jid, content, { ...globalContextInfo, ...options });
                botLogger.log('MESSAGE', `✅ Message sent successfully to: ${jid}`);
                return result;
            } else {
                botLogger.log('WARNING', 'Cannot send message: Bot not connected');
                return null;
            }
        } catch (error) {
            botLogger.log('ERROR', "Send error: " + error.message);
            return null;
        }
    }
}

// ==============================
// 🚀 BOT INSTANCE CREATION
// ==============================
const bot = new SilvaBot();

// Export bot instance for index.js
module.exports = {
    bot,
    config,
    logger: botLogger,
    functions: new FunctionsWrapper()
};

// ==============================
// 🛡️ ERROR HANDLERS
// ==============================
process.on('uncaughtException', (error) => {
    botLogger.log('ERROR', `Uncaught Exception: ${error.message}`);
    botLogger.log('ERROR', `Stack: ${error.stack}`);
});

process.on('unhandledRejection', (reason, promise) => {
    botLogger.log('ERROR', `Unhandled Rejection at: ${promise}, reason: ${reason}`);
});

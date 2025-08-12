const fs = require('fs');
const path = require('path');
const { isJidGroup, delay } = require('@whiskeysockets/baileys');

// ✅ Ultra-Reliable Session Manager
class SessionManager {
    constructor() {
        this.activeSessions = new Map(); // jid -> { lastActive, retryCount }
        this.maxRetries = 3;
        this.retryDelays = [500, 1500, 3000]; // Exponential backoff
        this.sessionTTL = 300000; // 5 minutes
    }
    
    registerSession(jid) {
        this.activeSessions.set(jid, {
            lastActive: Date.now(),
            retryCount: 0
        });
    }
    
    hasValidSession(jid) {
        const session = this.activeSessions.get(jid);
        if (!session) return false;
        
        // Reset retry count if session is still valid
        if (Date.now() - session.lastActive < this.sessionTTL) {
            session.retryCount = 0;
            return true;
        }
        
        // Session expired
        this.activeSessions.delete(jid);
        return false;
    }
    
    async recoverSession(sock, jid) {
        const session = this.activeSessions.get(jid) || { retryCount: 0 };
        
        if (session.retryCount >= this.maxRetries) {
            console.warn(`[Session] Max retries reached for ${jid}`);
            return false;
        }
        
        session.retryCount++;
        const delayTime = this.retryDelays[session.retryCount - 1];
        console.warn(`[Session] Recovery attempt ${session.retryCount} for ${jid} in ${delayTime}ms`);
        
        try {
            // Step 1: Refresh connection
            await sock.ev.flush();
            await sock.end();
            
            // Step 2: Reconnect
            await sock.connect();
            
            // Step 3: Resync critical data
            await sock.groupFetchAllParticipating();
            
            // Reset session
            this.registerSession(jid);
            console.log(`[Session] Recovery successful for ${jid}`);
            return true;
        } catch (recoveryError) {
            console.error(`[Session] Recovery failed for ${jid}:`, recoveryError.message);
            return false;
        }
    }
}

const sessionManager = new SessionManager();

// ✅ God-Mode SafeSend
async function safeSend(sock, jid, content, options = {}) {
    // Validate inputs
    if (!jid || typeof jid !== 'string') return;
    if (!sock?.sendMessage) return;
    
    try {
        // Ensure valid session
        if (!sessionManager.hasValidSession(jid)) {
            const recovered = await sessionManager.recoverSession(sock, jid);
            if (!recovered) return;
        }
        
        // Send message
        const result = await sock.sendMessage(jid, content, options);
        sessionManager.registerSession(jid);
        return result;
    } catch (error) {
        const reason = error?.message || 'Unknown error';
        
        // Session errors
        if (reason.includes('No sessions') || reason.includes('session not found')) {
            console.warn(`[SafeSend] Session error for ${jid}: ${reason}`);
            return safeSend(sock, jid, content, options); // Automatic retry
        }
        // Group errors
        else if (reason.includes('not in group')) {
            console.warn(`[SafeSend] Bot not in group ${jid}`);
            try {
                const inviteCode = await sock.groupInviteCode(jid);
                await safeSend(sock, jid, {
                    text: `📩 Rejoin link: https://chat.whatsapp.com/${inviteCode}`
                });
            } catch (inviteError) {
                console.warn('[Group] Failed to get invite link:', inviteError.message);
            }
        }
        // Other errors
        else {
            console.error(`[SafeSend] Critical error for ${jid}:`, reason);
        }
    }
}

// ✅ Plugin Loader with Automatic Repair
const plugins = [];
const pluginDir = path.join(__dirname, 'plugins');
const pluginFiles = fs.existsSync(pluginDir)
    ? fs.readdirSync(pluginDir).filter(file => file.endsWith('.js'))
    : [];

for (const file of pluginFiles) {
    try {
        const pluginPath = path.join(pluginDir, file);
        delete require.cache[require.resolve(pluginPath)];
        const plugin = require(pluginPath);
        
        // Automatic structure repair
        if (!plugin.commands && plugin.name) plugin.commands = [plugin.name];
        if (typeof plugin.run !== 'function' && typeof plugin.handler === 'function') {
            plugin.run = plugin.handler;
        }
        
        // Validate plugin
        if (plugin?.commands?.length && typeof plugin.run === 'function') {
            plugins.push(plugin);
            console.log(`[Plugin] Loaded: ${file} (${plugin.commands.join(', ')})`);
        } else {
            console.warn(`[Plugin] Skipped invalid plugin: ${file}`);
        }
    } catch (err) {
        console.error(`[Plugin] Error loading ${file}:`, err.stack || err);
        
        // Attempt to repair
        try {
            const repairedPlugin = {
                commands: ['error'],
                run: async (sock, message, args, context) => {
                    await context.safeSend({
                        text: `⚠️ Plugin ${file} failed to load. Please reinstall.`
                    });
                }
            };
            plugins.push(repairedPlugin);
        } catch (repairError) {
            console.error('[Plugin] Repair failed:', repairError);
        }
    }
}

// ✅ Connection Manager
function setupConnectionHandlers(sock) {
    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update;
        
        if (connection === 'close') {
            const statusCode = lastDisconnect.error?.output?.statusCode;
            console.log(`[Connection] Closed with status: ${statusCode || 'unknown'}`);
            
            if (statusCode !== 401) { // Don't reconnect if logged out
                setTimeout(async () => {
                    try {
                        console.log('[Connection] Reconnecting...');
                        await sock.connect();
                    } catch (reconnectError) {
                        console.error('[Connection] Reconnect failed:', reconnectError);
                    }
                }, 2000);
            }
        } else if (connection === 'open') {
            console.log('[Connection] Successfully connected');
            // Resync all active sessions
            sessionManager.activeSessions.forEach((_, jid) => {
                sessionManager.registerSession(jid);
            });
        }
    });
}

// ✅ Message Handler
async function handleMessages(sock, message) {
    try {
        const msg = message.message;
        const jid = message.key.remoteJid;
        const sender = message.key.participant || jid;
        const isFromBot = message.key.fromMe || sender === sock?.user?.id;

        // Ignore bot's own messages
        if (isFromBot || !msg) return;

        // Register session
        sessionManager.registerSession(jid);

        const isGroup = isJidGroup(jid);
        let groupMetadata = null;

        // Extract text content
        const getText = () => {
            if (msg.conversation) return msg.conversation;
            if (msg.extendedTextMessage?.text) return msg.extendedTextMessage.text;
            if (msg.imageMessage?.caption) return msg.imageMessage.caption;
            if (msg.videoMessage?.caption) return msg.videoMessage.caption;
            return '';
        };
        
        const text = getText();
        if (!text) return;

        // Parse command
        const prefix = process.env.PREFIX || '.';
        const isCommand = text.startsWith(prefix);
        const args = isCommand ? text.slice(prefix.length).trim().split(/\s+/) : [];
        const command = args.shift()?.toLowerCase();

        // Create context
        const context = {
            sock,
            message,
            sender,
            jid,
            isGroup,
            groupMetadata,
            args,
            text,
            safeSend: (content, opts) => safeSend(sock, jid, content, opts)
        };

        // Process plugins
        for (const plugin of plugins) {
            try {
                // Skip if not allowed in context
                const allowInGroup = plugin.group ?? true;
                const allowInPrivate = plugin.private ?? true;
                if ((isGroup && !allowInGroup) || (!isGroup && !allowInPrivate)) continue;

                // Command match
                if (isCommand && plugin.commands.includes(command)) {
                    await plugin.run(sock, message, args, context);
                }
                
                // Message-based triggers
                if (!isCommand && typeof plugin.onMessage === 'function') {
                    await plugin.onMessage(sock, message, text, context);
                }
            } catch (err) {
                console.error(`[Plugin] Error in ${plugin.commands[0] || 'plugin'}:`, err.stack || err);
                await safeSend(sock, jid, {
                    text: `⚠️ Error in command: ${err.message || 'Unknown error'}`
                });
            }
        }
    } catch (err) {
        console.error('[Handler] Critical error:', err.stack || err);
    }
}

module.exports = { 
    handleMessages, 
    safeSend, 
    setupConnectionHandlers
};

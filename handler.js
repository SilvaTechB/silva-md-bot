const fs = require('fs');
const path = require('path');
const { isJidGroup } = require('@whiskeysockets/baileys');

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
        
        if (Date.now() - session.lastActive < this.sessionTTL) {
            session.retryCount = 0;
            return true;
        }
        
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
            await sock.ev.flush();
            await sock.end();
            await sock.connect();
            await sock.groupFetchAllParticipating();
            
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
    if (!jid || typeof jid !== 'string') return;
    if (!sock?.sendMessage) return;
    
    try {
        if (!sessionManager.hasValidSession(jid)) {
            const recovered = await sessionManager.recoverSession(sock, jid);
            if (!recovered) return;
        }
        
        const result = await sock.sendMessage(jid, content, options);
        sessionManager.registerSession(jid);
        return result;
    } catch (error) {
        const reason = error?.message || 'Unknown error';
        
        if (reason.includes('No sessions') || reason.includes('session not found')) {
            console.warn(`[SafeSend] Session error for ${jid}: ${reason}`);
            return safeSend(sock, jid, content, options);
        } else if (reason.includes('not in group')) {
            console.warn(`[SafeSend] Bot not in group ${jid}`);
            try {
                const inviteCode = await sock.groupInviteCode(jid);
                await safeSend(sock, jid, {
                    text: `📩 Rejoin link: https://chat.whatsapp.com/${inviteCode}`
                });
            } catch (inviteError) {
                console.warn('[Group] Failed to get invite link:', inviteError.message);
            }
        } else {
            console.error(`[SafeSend] Critical error for ${jid}:`, reason);
        }
    }
}

// ✅ Plugin Loader
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
        
        if (!plugin.commands && plugin.name) plugin.commands = [plugin.name];
        if (typeof plugin.run !== 'function' && typeof plugin.handler === 'function') {
            plugin.run = plugin.handler;
        }
        
        if (plugin?.commands?.length && typeof plugin.run === 'function') {
            plugins.push(plugin);
            console.log(`[Plugin] Loaded: ${file} (${plugin.commands.join(', ')})`);
        } else {
            console.warn(`[Plugin] Skipped invalid plugin: ${file}`);
        }
    } catch (err) {
        console.error(`[Plugin] Error loading ${file}:`, err.stack || err);
    }
}

// ✅ Connection Manager
function setupConnectionHandlers(sock) {
    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update;
        
        if (connection === 'close') {
            const statusCode = lastDisconnect?.error?.output?.statusCode;
            console.log(`[Connection] Closed with status: ${statusCode || 'unknown'}`);
            
            if (statusCode !== 401) {
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

        if (isFromBot || !msg) return;
        sessionManager.registerSession(jid);

        const isGroup = isJidGroup(jid);

        const getText = () => {
            if (msg.conversation) return msg.conversation;
            if (msg.extendedTextMessage?.text) return msg.extendedTextMessage.text;
            if (msg.imageMessage?.caption) return msg.imageMessage.caption;
            if (msg.videoMessage?.caption) return msg.videoMessage.caption;
            return '';
        };
        
        const text = getText();
        if (!text) return;

        const prefix = process.env.PREFIX || '.';
        const isCommand = text.startsWith(prefix);
        const args = isCommand ? text.slice(prefix.length).trim().split(/\s+/) : [];
        const command = args.shift()?.toLowerCase();

        // ✅ Inject conn here
        const context = {
            sock,
            conn: sock,  // 👈 Added this so plugins can use conn.sendMessage
            message,
            sender,
            jid,
            isGroup,
            args,
            text,
            safeSend: (content, opts) => safeSend(sock, jid, content, opts)
        };

        for (const plugin of plugins) {
            try {
                const allowInGroup = plugin.group ?? true;
                const allowInPrivate = plugin.private ?? true;
                if ((isGroup && !allowInGroup) || (!isGroup && !allowInPrivate)) continue;

                if (isCommand && plugin.commands.includes(command)) {
                    await plugin.run(sock, message, args, context);
                }
                
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

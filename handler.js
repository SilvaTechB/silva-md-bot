const fs = require('fs');
const path = require('path');
const { isJidGroup, delay } = require('@whiskeysockets/baileys');

// Global session manager
const sessionManager = {
    activeSessions: new Map(), // jid -> timestamp
    maxRetries: 3,
    retryDelays: [1000, 3000, 5000], // Exponential backoff
    sessionTimeout: 300000, // 5 minutes
    
    // ✅ Register a session for JID
    registerSession(jid) {
        this.activeSessions.set(jid, Date.now());
    },
    
    // ✅ Check if session exists and is valid
    hasValidSession(jid) {
        const timestamp = this.activeSessions.get(jid);
        if (!timestamp) return false;
        
        // Check if session expired
        if (Date.now() - timestamp > this.sessionTimeout) {
            this.activeSessions.delete(jid);
            return false;
        }
        
        return true;
    },
    
    // ✅ Session recovery handler
    async recoverSession(sock, jid) {
        console.warn(`[Session] Attempting recovery for ${jid}`);
        
        try {
            // Step 1: Refresh connection state
            await sock.ev.flush();
            await sock.end();
            await sock.waitForConnectionUpdate(update => update.connection === "close");
            
            // Step 2: Reconnect
            await sock.connect();
            await sock.waitForConnectionUpdate(update => update.connection === "open");
            
            // Step 3: Request new prekeys
            await sock.requestPairingCode(sock.user.id.split(':')[0]);
            
            // Step 4: Re-sync groups
            await sock.groupFetchAllParticipating();
            
            // Mark session as active
            this.registerSession(jid);
            return true;
        } catch (recoveryError) {
            console.error('[Session] Recovery failed:', recoveryError);
            return false;
        }
    }
};

// ✅ God-mode safeSend with session management
async function safeSend(sock, jid, content, options = {}, attempt = 0) {
    // Validate parameters
    if (!jid || typeof jid !== 'string') {
        console.warn('[SafeSend] Invalid JID:', jid);
        return;
    }
    
    if (!sock || typeof sock.sendMessage !== 'function') {
        console.warn('[SafeSend] Invalid socket');
        return;
    }
    
    try {
        // Ensure session exists
        if (!sessionManager.hasValidSession(jid)) {
            console.warn(`[Session] No valid session for ${jid}, attempting recovery`);
            const recovered = await sessionManager.recoverSession(sock, jid);
            if (!recovered) {
                console.error(`[SafeSend] Session recovery failed for ${jid}`);
                return;
            }
        }
        
        // Attempt to send
        const result = await sock.sendMessage(jid, content, options);
        sessionManager.registerSession(jid); // Renew session
        return result;
    } catch (error) {
        const reason = error?.message || error;
        
        // Handle session errors
        if (reason.includes('No sessions') || reason.includes('session not found')) {
            if (attempt < sessionManager.maxRetries) {
                const delayTime = sessionManager.retryDelays[attempt];
                console.warn(`[SafeSend] Retry ${attempt+1}/${sessionManager.maxRetries} for ${jid} in ${delayTime}ms`);
                
                await delay(delayTime);
                return safeSend(sock, jid, content, options, attempt + 1);
            }
            console.error(`[SafeSend] Permanent failure for ${jid} after ${sessionManager.maxRetries} attempts`);
        } 
        // Handle group errors
        else if (reason.includes('not in group')) {
            console.warn(`[SafeSend] Bot not in group ${jid}`);
            try {
                const inviteCode = await sock.groupInviteCode(jid);
                console.log(`[Group] Rejoin link: https://chat.whatsapp.com/${inviteCode}`);
            } catch (inviteError) {
                console.warn('[Group] Failed to get invite link:', inviteError.message);
            }
        } 
        // Handle other errors
        else {
            console.error(`[SafeSend] Critical error for ${jid}:`, reason);
        }
    }
}

// ✅ Plugin loader with backward compatibility
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
        
        // Backward compatibility for old plugin formats
        if (!plugin.commands && plugin.name) {
            plugin.commands = [plugin.name];
        }
        
        // Support both 'run' and 'handler' functions
        if (typeof plugin.run !== 'function' && typeof plugin.handler === 'function') {
            plugin.run = plugin.handler;
        }
        
        if (plugin?.commands?.length && typeof plugin.run === 'function') {
            plugins.push(plugin);
            console.log(`[Plugin] Loaded: ${file} (${plugin.commands.join(', ')})`);
            
            // Register plugin commands as sessions
            plugin.commands.forEach(cmd => {
                sessionManager.registerSession(cmd);
            });
        } else {
            console.warn(`[Plugin] Skipped invalid plugin: ${file}`);
        }
    } catch (err) {
        console.error(`[Plugin] Error loading ${file}:`, err.stack || err);
    }
}

// ✅ Connection manager for session recovery
function setupConnectionHandlers(sock) {
    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update;
        
        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect.error?.output?.statusCode !== 401);
            console.log(`[Connection] Closed: ${lastDisconnect.error} | Reconnecting: ${shouldReconnect}`);
            
            if (shouldReconnect) {
                setTimeout(async () => {
                    try {
                        console.log('[Connection] Attempting reconnect...');
                        sock.ev.emit('connection.update', { connection: 'connecting' });
                        await sock.end();
                        await sock.connect();
                    } catch (reconnectError) {
                        console.error('[Connection] Reconnect failed:', reconnectError);
                    }
                }, 2000);
            }
        } else if (connection === 'open') {
            console.log('[Connection] Opened, restoring sessions...');
            // Restore all known sessions
            sessionManager.activeSessions.forEach((_, jid) => {
                sessionManager.registerSession(jid);
            });
        }
    });

    // Handle new messages to register sessions
    sock.ev.on('messages.upsert', async (m) => {
        const jid = m.messages[0]?.key.remoteJid;
        if (jid) sessionManager.registerSession(jid);
    });
}

/**
 * Main message handler
 */
async function handleMessages(sock, message) {
    try {
        const msg = message.message;
        const jid = message.key.remoteJid;
        const sender = message.key.participant || jid;
        const isFromBot = message.key.fromMe || sender === sock?.user?.id;

        // Ignore messages from the bot itself
        if (isFromBot || !msg) return;

        // Register session immediately
        sessionManager.registerSession(jid);

        const isGroup = isJidGroup(jid);
        let groupMetadata = null;

        // Extract message text
        const text =
            msg?.conversation ||
            msg?.extendedTextMessage?.text ||
            msg?.imageMessage?.caption ||
            msg?.videoMessage?.caption ||
            '';

        if (!text) return;

        // Parse command
        const prefix = require('./config').PREFIX || '.';
        const isCommand = text.startsWith(prefix);
        const args = isCommand ? text.slice(prefix.length).trim().split(/\s+/) : [];
        const command = args.shift()?.toLowerCase();

        // Context for plugins - FIXED CONTEXT INVOCATION
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

        // Execute plugins
        for (const plugin of plugins) {
            try {
                // Context filtering
                const allowInGroup = plugin.group ?? true;
                const allowInPrivate = plugin.private ?? true;
                if ((isGroup && !allowInGroup) || (!isGroup && !allowInPrivate)) continue;

                // Command match
                if (isCommand && plugin.commands.includes(command)) {
                    await plugin.run(sock, message, args, context);
                }

                // Non-command triggers
                if (!isCommand && typeof plugin.onMessage === 'function') {
                    await plugin.onMessage(sock, message, text, context);
                }
            } catch (err) {
                console.error(`[Plugin] ${plugin.commands?.[0] || 'Unknown'} error:`, err.stack || err);
                await safeSend(sock, jid, { 
                    text: `❌ Plugin error: ${err.message || 'Failed to execute command'}`
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
    setupConnectionHandlers,
    sessionManager
};

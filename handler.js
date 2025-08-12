const fs = require('fs');
const path = require('path');
const { isJidGroup } = require('@whiskeysockets/baileys');

// ✅ Robust JID normalization
function normalizeJid(jid) {
    if (!jid) return jid;
    // Handle all JID formats:
    // - Remove device IDs (e.g., :0, :1, :2)
    // - Standardize domains (c.us → s.whatsapp.net)
    // - Preserve group JIDs
    return jid
        .replace(/(:\d+)?@/, '@')
        .replace(/@c\.us$/, '@s.whatsapp.net')
        .replace(/@g\.us$/, '@g.us');
}

// ✅ Enhanced group membership check
async function isBotInGroup(sock, groupJid) {
    try {
        const metadata = await sock.groupMetadata(groupJid);
        const botJid = normalizeJid(sock.user.id);
        
        // Check participants
        const match = metadata.participants.some(p => 
            normalizeJid(p.id) === botJid
        );
        
        if (!match) {
            console.warn(`[GroupCheck] Bot ${botJid} not found in group ${groupJid}`);
            console.warn(`[GroupCheck] Participants:`, 
                metadata.participants.map(p => normalizeJid(p.id)).join(', '));
            
            // Attempt to get invite code for rejoining
            try {
                const inviteCode = await sock.groupInviteCode(groupJid);
                if (inviteCode) {
                    console.log(`[GroupCheck] Rejoin link: https://chat.whatsapp.com/${inviteCode}`);
                }
            } catch (rejoinErr) {
                console.warn('[GroupCheck] Failed to get invite link:', rejoinErr.message);
            }
        }
        
        return match;
    } catch (err) {
        console.warn(`[GroupCheck] Error in ${groupJid}:`, err.message);
        
        // Session recovery attempt
        if (err.message.includes('not in group') || err.message.includes('No sessions')) {
            try {
                console.log('[Session] Attempting to resync groups...');
                await sock.groupFetchAllParticipating();
                return true; // Assume we're in group after sync
            } catch (syncErr) {
                console.warn('[Session] Sync failed:', syncErr.message);
            }
        }
        
        return false;
    }
}

// ✅ Admin check function
async function isUserAdmin(sock, groupJid, userJid) {
    try {
        const metadata = await sock.groupMetadata(groupJid);
        const normalizedUser = normalizeJid(userJid);
        
        const participant = metadata.participants.find(
            p => normalizeJid(p.id) === normalizedUser
        );
        
        return participant && ['admin', 'superadmin'].includes(participant.admin);
    } catch (err) {
        console.warn(`[AdminCheck] Error in ${groupJid}:`, err.message);
        return false;
    }
}

// ✅ Smart safeSend with session recovery
async function safeSend(sock, jid, content, options = {}) {
    try {
        if (!jid || typeof jid !== 'string') {
            console.warn(`[SafeSend] Invalid JID: ${jid}`);
            return;
        }

        if (!sock || typeof sock.sendMessage !== 'function') {
            console.warn('[SafeSend] Socket not ready or sendMessage missing');
            return;
        }

        // Group session validation
        if (isJidGroup(jid)) {
            const inGroup = await isBotInGroup(sock, jid);
            if (!inGroup) {
                console.warn(`[SafeSend] Bot not in group ${jid}. Skipping.`);
                return;
            }
        }

        return await sock.sendMessage(jid, content, options);
    } catch (err) {
        const reason = err?.message || err;
        
        // Session recovery cases
        if (reason.includes('No sessions') || reason.includes('not in group')) {
            console.warn(`[Session] Recovering session for ${jid}`);
            
            try {
                // Resync group info
                await sock.groupFetchAllParticipating();
                
                // Wait briefly before retry
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                // Retry after sync
                return await sock.sendMessage(jid, content, options);
            } catch (recoverErr) {
                console.error('[Session] Recovery failed:', recoverErr.message);
            }
        }
        
        console.error(`[SafeSend] Failed to send to ${jid}:`, reason);
    }
}

// ✅ Plugin loader with cache clearing
const plugins = [];
const pluginDir = path.join(__dirname, 'plugins');
const pluginFiles = fs.existsSync(pluginDir)
    ? fs.readdirSync(pluginDir).filter(file => file.endsWith('.js'))
    : [];

for (const file of pluginFiles) {
    try {
        const pluginPath = path.join(pluginDir, file);
        delete require.cache[require.resolve(pluginPath)]; // Clear cache
        const plugin = require(pluginPath);
        
        // Support both old and new plugin formats
        if (!plugin.commands && plugin.name) {
            plugin.commands = [plugin.name];
        }
        
        if (plugin && Array.isArray(plugin.commands) && typeof plugin.run === 'function') {
            plugins.push(plugin);
            console.log(`[Plugin Loader] Loaded: ${file} (${plugin.commands.join(', ')})`);
        } else {
            console.warn(`[Plugin Loader] Skipped invalid plugin: ${file}`);
        }
    } catch (err) {
        console.error(`[Plugin Loader] Error loading ${file}:`, err.stack || err);
    }
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

        const isGroup = isJidGroup(jid);
        let groupMetadata = null;

        // Fetch group metadata if needed
        if (isGroup) {
            try {
                groupMetadata = await sock.groupMetadata(jid);
            } catch (err) {
                console.warn(`[GroupMeta] Failed for ${jid}:`, err.message);
            }
        }

        // Extract message text
        const text =
            msg?.conversation ||
            msg?.extendedTextMessage?.text ||
            msg?.imageMessage?.caption ||
            msg?.videoMessage?.caption ||
            '';

        if (!text) return;

        // Parse command and arguments
        const prefix = require('./config').PREFIX || '.';
        const isCommand = text.startsWith(prefix);
        const args = isCommand ? text.slice(prefix.length).trim().split(/\s+/) : [];
        const command = args.shift()?.toLowerCase();

        // Context for plugins
        const context = {
            sock,
            message,
            sender,
            jid,
            isGroup,
            groupMetadata,
            args,
            text,
            safeSend
        };

        // Execute matching plugins
        for (const plugin of plugins) {
            try {
                // Scope filtering
                const allowInGroup = plugin.group ?? true;
                const allowInPrivate = plugin.private ?? true;

                // Skip if not allowed in current context
                if (isGroup && !allowInGroup) continue;
                if (!isGroup && !allowInPrivate) continue;
                
                // Admin check
                if (plugin.admin && isGroup) {
                    const isAdmin = await isUserAdmin(sock, jid, sender);
                    if (!isAdmin) {
                        console.log(`[AdminBlock] Non-admin used ${plugin.commands[0]} in ${jid}`);
                        await safeSend(sock, jid, {
                            text: `⚠️ This command is restricted to group admins only.`
                        }, { quoted: message });
                        continue;
                    }
                }

                // Command match
                if (isCommand && plugin.commands.includes(command)) {
                    await plugin.run(sock, message, args, context);
                }

                // Non-command triggers
                if (!isCommand && typeof plugin.onMessage === 'function') {
                    await plugin.onMessage(sock, message, text, context);
                }
            } catch (err) {
                console.error(`[Plugin Error] ${plugin.commands[0] || 'Unknown'} failed:`, err.stack || err);
                await safeSend(sock, jid, {
                    text: `❌ Error in command *${plugin.commands[0] || 'unknown'}*`
                }, { quoted: message });
            }
        }
    } catch (err) {
        console.error('[Handler] Critical error:', err.stack || err);
    }
}

module.exports = { handleMessages, safeSend, isBotInGroup };

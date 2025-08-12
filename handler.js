const fs = require('fs');
const path = require('path');
const { isJidGroup } = require('@whiskeysockets/baileys');

// ✅ Universal JID normalization with Lid support
function normalizeJid(jid) {
    if (!jid) return jid;
    
    // Handle WhatsApp Lid format (new in 2025)
    if (jid.endsWith('@lid')) {
        return jid;
    }
    
    // Handle standard JID formats
    const [userPart, domainPart] = jid.split('@');
    const baseUser = userPart?.split(':')[0];
    
    if (!baseUser || !domainPart) return jid;
    
    // Standardize domains
    if (domainPart.includes('g.us')) return `${baseUser}@g.us`;
    if (domainPart.includes('c.us') || domainPart.includes('s.whatsapp.net')) {
        return `${baseUser}@s.whatsapp.net`;
    }
    
    return jid;
}

// ✅ Simplified group membership check
async function isBotInGroup(sock, groupJid) {
    try {
        // Skip check for Lid groups as metadata isn't reliable
        if (groupJid.endsWith('@lid')) return true;
        
        const metadata = await sock.groupMetadata(groupJid);
        const botJid = normalizeJid(sock.user.id);
        
        return metadata.participants.some(p => 
            normalizeJid(p.id) === botJid
        );
    } catch (err) {
        console.warn(`[GroupCheck] Error in ${groupJid}:`, err.message);
        return true; // Assume in group on error
    }
}

// ✅ Optimized safeSend
async function safeSend(sock, jid, content, options = {}) {
    try {
        if (!jid || typeof jid !== 'string') return;
        if (!sock?.sendMessage) return;
        
        return await sock.sendMessage(jid, content, options);
    } catch (err) {
        const reason = err?.message || err;
        console.warn(`[SafeSend] Failed to ${jid}:`, reason);
    }
}

// ✅ Plugin loader
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
        
        // Backward compatibility
        if (!plugin.commands && plugin.name) plugin.commands = [plugin.name];
        
        if (plugin?.commands?.length && typeof plugin.run === 'function') {
            plugins.push(plugin);
            console.log(`[Plugin] Loaded: ${file} (${plugin.commands.join(', ')})`);
        }
    } catch (err) {
        console.error(`[Plugin] Error loading ${file}:`, err.stack || err);
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

        if (isFromBot || !msg) return;

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
            }
        }
    } catch (err) {
        console.error('[Handler] Error:', err.stack || err);
    }
}

module.exports = { handleMessages, safeSend };

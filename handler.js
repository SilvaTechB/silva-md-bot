const fs = require('fs');
const path = require('path');
const { isJidGroup } = require('@whiskeysockets/baileys');

// ✅ Fixed group membership check with custom JID normalization
async function isBotInGroup(sock, groupJid) {
    try {
        const metadata = await sock.groupMetadata(groupJid);
        
        // Custom JID normalization function
        const normalizeJid = (jid) => {
            if (!jid) return jid;
            // Remove device suffix and agent identifiers
            const userPart = jid.split(':')[0];
            // Ensure proper formatting
            return userPart.includes('@') ? userPart : userPart + '@s.whatsapp.net';
        };

        const botBase = normalizeJid(sock.user.id);
        const match = metadata.participants.some(p => 
            normalizeJid(p.id) === botBase
        );

        if (!match) {
            console.warn(`[GroupCheck] Bot ${botBase} not found in group ${groupJid}`);
        }

        return match;
    } catch (err) {
        console.warn(`[GroupCheck] Error in ${groupJid}:`, err.message);
        return false;
    }
}

// ✅ Safe message sender - prevents bot crashes on send errors
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

        // ✅ Check group membership before sending
        if (isJidGroup(jid)) {
            const inGroup = await isBotInGroup(sock, jid);
            if (!inGroup) {
                console.warn(`[SafeSend] Bot is not a member of ${jid}. Skipping send.`);
                return;
            }
        }

        return await sock.sendMessage(jid, content, options);
    } catch (err) {
        const reason = err?.message || err;
        if (reason.includes('No sessions')) {
            console.warn(`[SafeSend] No session available for ${jid}. Bot may not be fully joined or synced.`);
        } else {
            console.error(`[SafeSend] Failed to send message to ${jid}:`, reason);
        }
    }
}

// ✅ Load plugins from /plugins folder
const plugins = [];
const pluginDir = path.join(__dirname, 'plugins');
const pluginFiles = fs.existsSync(pluginDir)
    ? fs.readdirSync(pluginDir).filter(file => file.endsWith('.js'))
    : [];

for (const file of pluginFiles) {
    try {
        const plugin = require(path.join(pluginDir, file));
        if (plugin && typeof plugin.name === 'string' && typeof plugin.run === 'function') {
            plugins.push(plugin);
            console.log(`[Plugin Loader] Loaded plugin: ${plugin.name}`);
        } else {
            console.warn(`[Plugin Loader] Skipped invalid plugin: ${file}`);
        }
    } catch (err) {
        console.error(`[Plugin Loader] Error loading ${file}:`, err);
    }
}

/**
 * Main message handler
 * @param {import('@whiskeysockets/baileys').WASocket} sock - Baileys socket instance
 * @param {import('@whiskeysockets/baileys').proto.WebMessageInfo} message - Incoming message
 */
async function handleMessages(sock, message) {
    try {
        const msg = message.message;
        const jid = message.key.remoteJid;
        const sender = message.key.participant || jid;
        const isFromBot = message.key.fromMe || sender === sock?.user?.id;

        // ✅ Ignore messages from the bot itself
        if (isFromBot || !msg) return;

        const isGroup = isJidGroup(jid);
        let groupMetadata = null;

        // ✅ Fetch group metadata only if needed
        if (isGroup) {
            try {
                groupMetadata = await sock.groupMetadata(jid);
            } catch (err) {
                console.warn(`[GroupMeta] Failed to fetch metadata for ${jid}:`, err.message);
            }
        }

        // ✅ Extract message text
        const text =
            msg?.conversation ||
            msg?.extendedTextMessage?.text ||
            msg?.imageMessage?.caption ||
            msg?.videoMessage?.caption ||
            '';

        if (!text) return;

        // ✅ Parse command and arguments
        const prefix = require('./config').PREFIX || '.';
        const isCommand = text.startsWith(prefix);
        const args = isCommand ? text.slice(prefix.length).trim().split(/\s+/) : [];
        const command = args.shift()?.toLowerCase();

        // ✅ Context passed to plugins
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

        // ✅ Execute matching plugins
        for (const plugin of plugins) {
            try {
                // Scope filtering (default to true if not defined)
                const allowInGroup = plugin.group ?? true;
                const allowInPrivate = plugin.private ?? true;

                if (isGroup && !allowInGroup) continue;
                if (!isGroup && !allowInPrivate) continue;

                // Command match
                if (isCommand && plugin.name === command) {
                    await plugin.run(sock, message, args, context);
                }

                // Optional non-command trigger
                if (!isCommand && typeof plugin.onMessage === 'function') {
                    await plugin.onMessage(sock, message, text, context);
                }
            } catch (err) {
                console.error(`[Plugin Error] ${plugin.name} failed:`, err.message || err);
                await safeSend(sock, jid, {
                    text: `❌ Error in plugin *${plugin.name}*. Please try again later.`
                }, { quoted: message });
            }
        }
    } catch (err) {
        console.error('[Handler] Critical error:', err);
    }
}

module.exports = { handleMessages, safeSend };

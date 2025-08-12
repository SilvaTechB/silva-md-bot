// handler.js (replace your existing handler file with this)
// Improvements: robust normalizeJid, group checks, resilient safeSend, safer plugin execution + better logging

const fs = require('fs');
const path = require('path');
const { isJidGroup } = require('@whiskeysockets/baileys');

// ---------- Utilities ----------
function normalizeJid(jid) {
    if (!jid || typeof jid !== 'string') return jid;
    jid = jid.trim();

    // if already normalized-ish
    if (jid.endsWith('@g.us') || jid.endsWith('@s.whatsapp.net') || jid.endsWith('@c.us') || jid.endsWith('@lid')) {
        return jid;
    }

    // If jid contains multiple parts like user:device@domain or user@domain, pick base user and normalize domain
    const [userPart, domainPart] = jid.split('@');
    const baseUser = userPart?.split(':')[0];
    if (!baseUser) return jid;

    if (!domainPart) {
        // best effort: if looks like group id (numbers + -) assume g.us
        if (/^\d{8,}(-\d+)?$/.test(baseUser)) return `${baseUser}@g.us`;
        return `${baseUser}@s.whatsapp.net`;
    }

    // common domains mappings
    const d = domainPart.toLowerCase();
    if (d.includes('g.us')) return `${baseUser}@g.us`;
    if (d.includes('c.us') || d.includes('s.whatsapp.net')) return `${baseUser}@s.whatsapp.net`;
    if (d.includes('lid')) return `${baseUser}@lid`;

    // fallback: keep original
    return `${baseUser}@${domainPart}`;
}

// safer check handling both old/new participant shapes
async function isBotInGroup(sock, groupJid) {
    try {
        if (!groupJid) return false;
        const normalized = normalizeJid(groupJid);

        // treat lid groups as assumed present (metadata unreliable)
        if (normalized.endsWith('@lid')) return true;

        // if socket doesn't have groupMetadata, assume true to avoid blocking important flows
        if (!sock || typeof sock.groupMetadata !== 'function') return true;

        const metadata = await sock.groupMetadata(normalized);
        const botJid = normalizeJid(sock?.user?.id);

        if (!metadata || !Array.isArray(metadata.participants)) return true;

        return metadata.participants.some(p => {
            // participant can be object or plain string
            const id = (typeof p === 'string') ? p : (p?.id || p?.jid || p?.participant);
            return normalizeJid(id) === botJid;
        });
    } catch (err) {
        console.warn(`[GroupCheck] error for ${groupJid}:`, err?.message || err);
        // on error, don't block the message flow — assume bot is in group
        return true;
    }
}

// ---------- Resilient safeSend ----------
async function safeSend(sock, jid, content, options = {}) {
    try {
        if (!jid || !sock || typeof sock.sendMessage !== 'function') {
            console.warn('[SafeSend] Invalid args or socket not ready', { jid, hasSock: !!sock });
            return null;
        }

        const target = normalizeJid(jid);

        // If it's a group (or new lid group), send directly — groups do NOT use 1:1 sessions.
        if (isJidGroup(target) || target.endsWith('@lid') || target.endsWith('@g.us')) {
            try {
                return await sock.sendMessage(target, content, options);
            } catch (err) {
                console.warn(`[SafeSend] group send failed to ${target}:`, err?.message || err);
                return null;
            }
        }

        // Private chat: try regular send first
        try {
            return await sock.sendMessage(target, content, options);
        } catch (err) {
            const reason = (err && err.message) ? err.message : String(err || 'unknown');
            // Specific fallback for common "No sessions" error from libsignal / wa-crypto
            if (reason.includes('No sessions') || reason.toLowerCase().includes('no sessions') || reason.toLowerCase().includes('failed to find session')) {
                console.warn(`[SafeSend] No sessions for ${target}. Attempting safe fallback. Error: ${reason}`);

                // If content is a simple text or can be reduced to text, attempt plain-text fallback
                if (typeof content === 'string') {
                    try {
                        return await sock.sendMessage(target, { text: content }, options);
                    } catch (e2) {
                        console.warn(`[SafeSend] Fallback text send failed to ${target}:`, e2?.message || e2);
                        return null;
                    }
                }

                // Try to extract text if content is object (common shapes)
                const maybeText =
                    content?.text ||
                    content?.conversation ||
                    content?.extendedText?.text ||
                    content?.imageMessage?.caption ||
                    content?.videoMessage?.caption ||
                    '';

                if (maybeText) {
                    try {
                        return await sock.sendMessage(target, { text: maybeText }, options);
                    } catch (e3) {
                        console.warn(`[SafeSend] Fallback extracted text send failed to ${target}:`, e3?.message || e3);
                        return null;
                    }
                }

                // If we reach here, nothing else to do
                console.warn(`[SafeSend] Unable to deliver to ${target}: No sessions and no usable fallback.`);
                return null;
            }

            // Other errors — rethrow or log
            console.warn(`[SafeSend] Failed to ${target}:`, reason);
            return null;
        }
    } catch (err) {
        console.warn('[SafeSend] Unexpected error:', err?.stack || err);
        return null;
    }
}

// ---------- Plugin loader ----------
const plugins = [];
const pluginDir = path.join(__dirname, 'plugins');
const pluginFiles = fs.existsSync(pluginDir) ? fs.readdirSync(pluginDir).filter(f => f.endsWith('.js')) : [];

for (const file of pluginFiles) {
    try {
        const pluginPath = path.join(pluginDir, file);
        delete require.cache[require.resolve(pluginPath)];
        const plugin = require(pluginPath);

        // backwards compatibility
        if (!plugin.commands && plugin.name) plugin.commands = [plugin.name];

        if (plugin?.commands?.length && typeof plugin.run === 'function') {
            plugins.push(plugin);
            console.log(`[Plugin] Loaded: ${file} (${plugin.commands.join(', ')})`);
        } else if (typeof plugin.onMessage === 'function') {
            plugins.push(plugin);
            console.log(`[Plugin] Loaded (onMessage): ${file}`);
        } else {
            console.log(`[Plugin] Skipped (no commands/onMessage): ${file}`);
        }
    } catch (err) {
        console.error(`[Plugin] Error loading ${file}:`, err?.stack || err);
    }
}

// ---------- Message handler ----------
async function handleMessages(sock, message) {
    try {
        if (!message) return;
        const msg = message.message;
        const jidRaw = message.key?.remoteJid;
        const jid = normalizeJid(jidRaw);
        const senderRaw = message.key?.participant || message.key?.fromMe ? sock?.user?.id : null;
        const sender = normalizeJid(senderRaw || message.key?.participant || jid);

        // ignore if message from bot or no msg
        const isFromBot = message.key?.fromMe || (sender && sender === normalizeJid(sock?.user?.id));
        if (isFromBot || !msg) return;

        const isGroup = isJidGroup(jid) || jid?.endsWith('@lid') || jid?.endsWith('@g.us');

        // extract text safely (many possible shapes)
        const text =
            msg?.conversation ||
            msg?.extendedTextMessage?.text ||
            msg?.imageMessage?.caption ||
            msg?.videoMessage?.caption ||
            msg?.buttonsMessage?.contentText ||
            msg?.listMessage?.singleSelectReply?.selectedRowId ||
            msg?.ephemeralMessage?.message?.conversation ||
            '';

        if (!text) {
            // no textual content to process — but still may need to pass to plugins that accept media
            // if no plugin needs it, we skip
        }

        // config prefix (cache require)
        let prefix = '.';
        try {
            const cfg = require('./config');
            prefix = cfg?.PREFIX || prefix;
        } catch (e) {
            // keep default
        }

        const isCommand = typeof text === 'string' && text.startsWith(prefix);
        const args = isCommand ? text.slice(prefix.length).trim().split(/\s+/) : [];
        const command = isCommand && args.length ? args.shift().toLowerCase() : null;

        const context = {
            sock,
            message,
            sender,
            jid,
            isGroup,
            args,
            text,
            safeSend,
            normalizeJid,
            isBotInGroup
        };

        // Execute plugins (safely)
        for (const plugin of plugins) {
            try {
                const allowInGroup = plugin.group ?? true;
                const allowInPrivate = plugin.private ?? true;
                if ((isGroup && !allowInGroup) || (!isGroup && !allowInPrivate)) continue;

                // command handlers
                if (isCommand && command && Array.isArray(plugin.commands) && plugin.commands.map(c => c.toLowerCase()).includes(command)) {
                    await plugin.run(sock, message, args, context);
                }

                // non-command message hooks
                if (!isCommand && typeof plugin.onMessage === 'function') {
                    await plugin.onMessage(sock, message, text, context);
                }
            } catch (err) {
                console.error(`[Plugin] ${plugin.commands?.[0] || plugin.name || 'Unknown'} error:`, err?.stack || err);
            }
        }
    } catch (err) {
        console.error('[Handler] Unhandled error:', err?.stack || err);
    }
}

module.exports = { handleMessages, safeSend, normalizeJid, isBotInGroup };

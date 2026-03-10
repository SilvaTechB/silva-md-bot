'use strict';

const fs = require('fs');
const path = require('path');
const config = require('./config');

let isJidGroup, areJidsSameUser, jidNormalizedUser;
try {
    ({ isJidGroup, areJidsSameUser, jidNormalizedUser } = require('@whiskeysockets/baileys'));
} catch {
    isJidGroup       = (jid) => typeof jid === 'string' && jid.endsWith('@g.us');
    jidNormalizedUser = (jid) => (jid || '').replace(/:[^@]+@/, '@');
    areJidsSameUser  = (a, b) => jidNormalizedUser(a) === jidNormalizedUser(b);
}

// Extract the bare phone-number string from any JID format
function jidToNum(jid) {
    if (!jid) return '';
    return jidNormalizedUser(jid).split('@')[0].replace(/\D/g, '');
}

// True when two phone numbers refer to the same subscriber.
// Handles missing country codes by comparing the last 9 significant digits.
function sameNumber(a, b) {
    if (!a || !b) return false;
    if (a === b) return true;
    const minLen = Math.min(a.length, b.length);
    const tail   = Math.min(minLen, 9);
    return tail >= 6 && a.slice(-tail) === b.slice(-tail);
}

// ─── Permission constants ────────────────────────────────────────────────────
const PERM = {
    PUBLIC: 'public',
    ADMIN:  'admin',
    OWNER:  'owner'
};

// ─── Group metadata cache (5 min TTL) ───────────────────────────────────────
const groupCache = new Map();
const GROUP_CACHE_TTL = 5 * 60 * 1000;

async function getCachedGroupMetadata(sock, jid) {
    const hit = groupCache.get(jid);
    if (hit && Date.now() < hit.expiry) return hit.metadata;
    try {
        const metadata = await sock.groupMetadata(jid);
        groupCache.set(jid, { metadata, expiry: Date.now() + GROUP_CACHE_TTL });
        return metadata;
    } catch {
        return null;
    }
}

// Invalidate cache when group membership changes
function bindGroupCacheInvalidation(sock) {
    sock.ev.on('group-participants.update', ({ id }) => groupCache.delete(id));
}

// ─── Safe send ───────────────────────────────────────────────────────────────
async function safeSend(sock, jid, content, opts = {}) {
    if (!jid || !sock?.sendMessage) return null;
    try {
        return await sock.sendMessage(jid, content, opts);
    } catch (err) {
        console.error(`[SafeSend] ${jid}: ${err.message}`);
        return null;
    }
}

// Newsletter watermark — only safe in private chats; groups get an empty object
const GLOBAL_CONTEXT_INFO = {
    forwardingScore: 999,
    isForwarded: true,
    forwardedNewsletterMessageInfo: {
        newsletterJid: '120363200367779016@newsletter',
        newsletterName: '◢◤ Silva Tech Nexus ◢◤',
        serverMessageId: 144
    }
};

// ─── Plugin loader ───────────────────────────────────────────────────────────
const plugins = [];
const pluginDir = path.join(__dirname, 'plugins');

function loadPlugins() {
    if (!fs.existsSync(pluginDir)) return;
    const files = fs.readdirSync(pluginDir).filter(f => f.endsWith('.js'));

    for (const file of files) {
        const pluginPath = path.join(pluginDir, file);
        try {
            delete require.cache[require.resolve(pluginPath)];
            const plugin = require(pluginPath);

            if (!plugin.commands && plugin.name) plugin.commands = [plugin.name];
            if (!plugin.run && typeof plugin.handler === 'function') plugin.run = plugin.handler;

            if (Array.isArray(plugin.commands) && plugin.commands.length && typeof plugin.run === 'function') {
                plugins.push(plugin);
                console.log(`[Plugin] Loaded: ${file} (${plugin.commands.join(', ')})`);
            } else {
                console.warn(`[Plugin] Skipped: ${file} — missing commands or run/handler`);
            }
        } catch (err) {
            console.error(`[Plugin] Error loading ${file}:`, err.stack || err.message);
        }
    }
    console.log(`[Plugin] ${plugins.length} plugins loaded`);
}

loadPlugins();

// ─── Connection handlers ─────────────────────────────────────────────────────
function setupConnectionHandlers(sock) {
    bindGroupCacheInvalidation(sock);
    sock.ev.on('connection.update', ({ connection }) => {
        if (connection === 'open') console.log('[Handler] WhatsApp connection open.');
    });
}

// ─── Command predictor ───────────────────────────────────────────────────────
function levenshtein(a, b) {
    const m = a.length, n = b.length;
    const dp = Array.from({ length: m + 1 }, (_, i) =>
        Array.from({ length: n + 1 }, (_, j) => i === 0 ? j : j === 0 ? i : 0)
    );
    for (let i = 1; i <= m; i++)
        for (let j = 1; j <= n; j++)
            dp[i][j] = a[i - 1] === b[j - 1]
                ? dp[i - 1][j - 1]
                : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    return dp[m][n];
}

function predictCommand(typed, allPlugins) {
    const flat = [];
    for (const plugin of allPlugins)
        for (const cmd of (plugin.commands || []))
            flat.push({ cmd, plugin });

    // 1. Unambiguous prefix match (typed ≥ 3 chars, matches exactly one command)
    if (typed.length >= 3) {
        const hits = flat.filter(({ cmd }) => cmd.startsWith(typed));
        if (hits.length === 1)
            return { plugin: hits[0].plugin, match: hits[0].cmd, confidence: 'prefix' };
        if (hits.length > 1)
            return { matches: [...new Set(hits.map(h => h.cmd))], confidence: 'ambiguous' };
    }

    // 2. Fuzzy match via Levenshtein distance
    //    threshold = 1 for short commands (≤4 chars), 2 for longer ones
    let best = null, bestDist = Infinity;
    for (const { cmd, plugin } of flat) {
        const dist = levenshtein(typed, cmd);
        const threshold = typed.length <= 4 ? 1 : 2;
        if (dist <= threshold && dist < bestDist) {
            best = { plugin, match: cmd, confidence: dist === 1 ? 'typo' : 'fuzzy' };
            bestDist = dist;
        }
    }
    return best;
}

// ─── Main message handler ────────────────────────────────────────────────────
function formatDuration(ms) {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    const h = Math.floor(m / 60);
    const d = Math.floor(h / 24);
    if (d > 0) return `${d}d ${h % 24}h`;
    if (h > 0) return `${h}h ${m % 60}m`;
    if (m > 0) return `${m}m ${s % 60}s`;
    return `${s}s`;
}

async function handleMessages(sock, message) {
    try {
        const msg = message.message;
        if (!msg) return;

        // jid  = the chat to respond to (group JID or private JID)
        // from = the individual who typed the command
        const jid    = message.key.remoteJid;
        const from   = message.key.participant || jid;
        // sender = chat JID for responses (matches legacy plugin expectation of m.key.remoteJid)
        const sender = jid;
        if (!jid || !from) return;

        // ── Auto-presence: fire instantly on every incoming message ──────────
        if (!message.key.fromMe && (config.AUTO_TYPING || config.AUTO_RECORDING)) {
            try { await sock.sendPresenceUpdate('composing', jid); } catch { /* non-fatal */ }
        }

        const isGroup = isJidGroup(jid);
        const prefix  = config.PREFIX || '.';

        // ── Extract text ─────────────────────────────────────────────────────
        const text =
            msg.conversation ||
            msg.extendedTextMessage?.text ||
            msg.imageMessage?.caption ||
            msg.videoMessage?.caption || '';

        // ── AFK auto-reply (fires before prefix check, not for owner's own messages) ──
        if (!message.key.fromMe) {
            const afkPlugin = plugins.find(p => p.commands?.includes('afk') && typeof p.isAfk === 'function');
            if (afkPlugin?.isAfk()) {
                const { reason, since } = afkPlugin.getAfkData();
                await safeSend(sock, jid, {
                    text: `🤖 *Beep boop!* This is a bot.\n\n👤 My owner is currently away.\n📝 *Reason:* ${reason}\n⏱ *Away for:* ${formatDuration(Date.now() - since)}`,
                }, { quoted: message });
                return;
            }
        }

        // ── Anti-link (group only, bot must be admin) ────────────────────────
        if (isGroup && !message.key.fromMe) {
            const antilinkOn = config.ANTILINK || global.antilinkGroups?.has(jid);
            if (antilinkOn) {
                const URL_REGEX = /(?:https?:\/\/|www\.)\S+|(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+(?:com|net|org|io|gg|me|ly|co|app|xyz|info|tv|link|shop|live|club|online|site|store|pro|in|ng|ke|tz|ug|za|uk)\b(?:\/\S*)?/gi;
                if (URL_REGEX.test(text)) {
                    try {
                        await sock.sendMessage(jid, {
                            delete: message.key
                        });
                        await safeSend(sock, jid, {
                            text: `⚠️ @${from.split('@')[0]} links are not allowed in this group.`,
                            mentions: [from]
                        });
                    } catch (e) {
                        console.error('[Antilink] delete failed:', e.message);
                    }
                    return;
                }
            }
        }

        if (!text.startsWith(prefix)) {
            if (!message.key.fromMe && (config.AUTO_TYPING || config.AUTO_RECORDING)) {
                try { await sock.sendPresenceUpdate('paused', jid); } catch { /* non-fatal */ }
            }
            return;
        }

        const parts   = text.slice(prefix.length).trim().split(/\s+/);
        const command = parts.shift().toLowerCase();
        const args    = parts;

        // ── Command predictor: resolve typos / short-forms ───────────────────
        let resolvedCommand = command;
        let predictionNote  = null;
        const exactExists   = plugins.some(p => p.commands?.includes(command));
        if (!exactExists) {
            const prediction = predictCommand(command, plugins);
            if (prediction?.confidence === 'ambiguous') {
                await safeSend(sock, jid, {
                    text: `❓ *Did you mean one of these?*\n${prediction.matches.map(c => `• \`${prefix}${c}\``).join('\n')}`
                }, { quoted: message });
                if (config.AUTO_TYPING || config.AUTO_RECORDING)
                    try { await sock.sendPresenceUpdate('paused', jid); } catch { /* ok */ }
                return;
            } else if (prediction) {
                resolvedCommand = prediction.match;
                if (prediction.confidence !== 'exact') {
                    predictionNote = `_💡 Running_ \`${prefix}${resolvedCommand}\``;
                }
            }
        }

        console.log(`[HANDLER] cmd=${command}${resolvedCommand !== command ? `→${resolvedCommand}` : ''} jid=${jid} from=${from}`);

        // ── Fetch group metadata FIRST — needed for LID resolution ────────────
        // Modern WhatsApp sends group messages with a @lid (privacy/account ID)
        // instead of a phone number. We must look up the LID in the participants
        // list to find the sender's real phone JID before doing any comparisons.
        let isAdmin       = false;
        let isBotAdmin    = false;
        let groupMetadata = null;

        if (isGroup) {
            groupMetadata = await getCachedGroupMetadata(sock, jid);
        }

        // ── Resolve sender phone (handle @lid format) ─────────────────────────
        const isLid = typeof from === 'string' && from.endsWith('@lid');
        let resolvedFrom = from; // will be the real phone JID if LID is resolved

        if (isLid && groupMetadata?.participants) {
            for (const p of groupMetadata.participants) {
                // Baileys 6.x stores the account LID in p.lid when available
                const pLid = p.lid || '';
                if (pLid && (pLid === from || jidNormalizedUser(pLid) === jidNormalizedUser(from))) {
                    resolvedFrom = p.id; // swap LID for real phone JID
                    break;
                }
            }
        }

        const fromNum = jidToNum(resolvedFrom);

        // ── Resolve owner / bot phone numbers ─────────────────────────────────
        // Pull directly from process.env first so stale config objects can't
        // cause a false empty result, then fall through to config and global.
        const ownerRaw  = (process.env.OWNER_NUMBER || '').trim()
            || (typeof config.OWNER_NUMBER === 'string' ? config.OWNER_NUMBER.trim() : '')
            || (global.botNum || '');
        const ownerNum  = ownerRaw.replace(/\D/g, '');
        const botNum    = (global.botNum || '').replace(/\D/g, '');

        // In full-LID groups WhatsApp never exposes phone numbers — the only
        // identifier is the account LID.  If the sender's LID matches the bot's
        // own LID they are the same WhatsApp account → owner.
        // Both sides must be normalised (strip :deviceSuffix) before comparing.
        const botLid     = jidNormalizedUser(global.botLid || '');
        const fromNorm   = jidNormalizedUser(from);

        const isOwner = message.key.fromMe
            || (botLid && fromNorm === botLid)
            || (botLid && jidNormalizedUser(resolvedFrom) === botLid)
            || (fromNum && ownerNum && (fromNum === ownerNum || sameNumber(fromNum, ownerNum)))
            || (fromNum && botNum   && (fromNum === botNum   || sameNumber(fromNum, botNum)));

        // ── Resolve group admin status ────────────────────────────────────────
        if (isGroup && groupMetadata?.participants) {
            const botJid     = sock.user?.id || '';
            const botPhone   = botNum;

            for (const p of groupMetadata.participants) {
                const role = p.admin;
                const isAdm = role === 'admin' || role === 'superadmin';
                const pPhone = (p.id || '').split('@')[0].replace(/\D/g, '');
                const pLid   = p.lid || '';

                // Is this participant the sender?
                const isSender =
                    areJidsSameUser(p.id, resolvedFrom) ||
                    (pLid && (pLid === from || jidNormalizedUser(pLid) === jidNormalizedUser(from))) ||
                    (pPhone && fromNum && sameNumber(pPhone, fromNum));

                // Is this participant the bot?
                const isBot =
                    areJidsSameUser(p.id, botJid) ||
                    (botLid && (jidNormalizedUser(p.id) === botLid || (pLid && jidNormalizedUser(pLid) === botLid))) ||
                    (botPhone && pPhone && sameNumber(pPhone, botPhone));

                if (isSender) isAdmin    = isAdm;
                if (isBot)    isBotAdmin = isAdm;
            }
        }

        // ── Build unified context ─────────────────────────────────────────────
        const ctx = {
            sock,
            conn:          sock,
            m:             message,
            message,
            sender,               // = jid (the chat) — where plugins send responses
            from,                 // = individual who typed the command
            jid,
            chat:          jid,
            isGroup,
            isAdmin,
            isBotAdmin,
            isOwner,
            args,
            text,
            prefix,
            groupMetadata,
            contextInfo:   isGroup ? {} : GLOBAL_CONTEXT_INFO,
            mentionedJid:  msg.extendedTextMessage?.contextInfo?.mentionedJid || [],
            safeSend:      (content, opts) => safeSend(sock, jid, content, opts),
            reply:         (replyText) => safeSend(sock, jid, { text: replyText }, { quoted: message })
        };

        // ── Ban gate — banned users cannot trigger any command (owner always exempt) ──
        if (!isOwner && global.bannedUsers?.size) {
            const senderNorm = jidNormalizedUser(from);
            if (global.bannedUsers.has(from) || global.bannedUsers.has(senderNorm) || global.bannedUsers.has(resolvedFrom)) {
                return await safeSend(sock, jid, { text: '⛔ You have been banned from using bot commands.' }, { quoted: message });
            }
        }

        // ── Dispatch ──────────────────────────────────────────────────────────
        const RECORDING_CMDS = new Set(['play', 'song', 'sticker', 's', 'tiktok', 'tt', 'ttdl', 'tiktokdl', 'youtube', 'yt', 'instagram', 'igdl', 'ig', 'insta', 'facebook', 'fb', 'fbdl']);

        for (const plugin of plugins) {
            if (!plugin.commands.includes(resolvedCommand)) continue;

            // Scope guards
            const allowGroup   = plugin.group   !== false;
            const allowPrivate = plugin.private !== false;
            if (isGroup  && !allowGroup)   continue;
            if (!isGroup && !allowPrivate) continue;

            // Permission check
            const perm = (plugin.permission || PERM.PUBLIC).toLowerCase();
            let allowed = false;
            if      (perm === PERM.PUBLIC) allowed = true;
            else if (perm === PERM.ADMIN)  allowed = isAdmin || isOwner;
            else if (perm === PERM.OWNER)  allowed = isOwner;

            if (!allowed) {
                const notice = perm === PERM.OWNER
                    ? '⛔ This command is reserved for the bot owner.'
                    : `⛔ This command requires ${isGroup ? 'group admin' : 'elevated'} privileges.`;
                await safeSend(sock, jid, { text: notice }, { quoted: message });
                continue;
            }

            // ── Prediction note: let user know what command was resolved ────
            if (predictionNote) {
                await safeSend(sock, jid, { text: predictionNote }, { quoted: message });
                predictionNote = null;
            }

            // ── Override presence to recording for media commands ───────────
            if (config.AUTO_RECORDING && RECORDING_CMDS.has(resolvedCommand)) {
                try { await sock.sendPresenceUpdate('recording', jid); } catch { /* non-fatal */ }
            }

            try {
                await plugin.run(sock, message, args, ctx);
            } catch (err) {
                console.error(`[Plugin:${command}] ${err.stack || err.message}`);
                await safeSend(sock, jid,
                    { text: `⚠️ Command error: ${err.message || 'unknown error'}` },
                    { quoted: message }
                );
            }

            // ── Auto-presence: back to paused after responding ───────────────
            if (config.AUTO_TYPING || config.AUTO_RECORDING) {
                try { await sock.sendPresenceUpdate('paused', jid); } catch { /* non-fatal */ }
            }
        }
    } catch (err) {
        console.error('[Handler] Fatal:', err.stack || err.message);
    }
}

module.exports = { handleMessages, safeSend, setupConnectionHandlers, PERM, plugins };

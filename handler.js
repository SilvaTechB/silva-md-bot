'use strict';

const fs = require('fs');
const path = require('path');
const config = require('./config');
const { getStr, getActiveTheme } = require('./lib/theme');

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

const sendTimestamps = [];
const MAX_SENDS_PER_MIN = 30;

async function safeSend(sock, jid, content, opts = {}) {
    if (!jid || !sock?.sendMessage) return null;
    try {
        const now = Date.now();
        while (sendTimestamps.length && now - sendTimestamps[0] > 60000) sendTimestamps.shift();
        if (sendTimestamps.length >= MAX_SENDS_PER_MIN) {
            const wait = 60000 - (now - sendTimestamps[0]);
            await new Promise(r => setTimeout(r, Math.min(wait, 3000)));
        }
        const jitter = Math.floor(Math.random() * 400) + 100;
        await new Promise(r => setTimeout(r, jitter));
        sendTimestamps.push(Date.now());
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

            // Support array exports (e.g. module.exports = [plugin1, plugin2, ...])
            const mods = Array.isArray(plugin) ? plugin : [plugin];

            for (const mod of mods) {
                if (!mod) continue;
                if (!mod.commands && mod.name) mod.commands = [mod.name];
                if (!mod.run && typeof mod.handler === 'function') mod.run = mod.handler;

                if (Array.isArray(mod.commands) && mod.commands.length && typeof mod.run === 'function') {
                    plugins.push(mod);
                } else {
                    if (mods.length === 1) console.warn(`[Plugin] Skipped: ${file} — missing commands or run/handler`);
                }
            }
        } catch (err) {
            console.error(`[Plugin] Error loading ${file}: ${err.message}`);
        }
    }
    console.log(`[Plugin] ✅ ${plugins.length} plugins loaded successfully`);
}

loadPlugins();

// ─── Connection handlers ─────────────────────────────────────────────────────
function setupConnectionHandlers(sock) {
    bindGroupCacheInvalidation(sock);
    sock.ev.on('connection.update', ({ connection }) => {
        if (connection === 'open') console.log('[Handler] WhatsApp connection open.');
    });
    sock.ev.on('group-participants.update', async (update) => {
        for (const p of plugins) {
            if (typeof p.onGroupParticipantsUpdate !== 'function') continue;
            try { await p.onGroupParticipantsUpdate(sock, update); } catch { /* ignore */ }
        }
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
            const presenceType = config.AUTO_RECORDING ? 'recording' : 'composing';
            try { await sock.sendPresenceUpdate(presenceType, jid); } catch { /* non-fatal */ }
        }

        const isGroup = isJidGroup(jid);

        // ── Multi-prefix parser ──────────────────────────────────────────────
        // PREFIX env var supports:
        //   '.'          → only dot prefix
        //   '.,!,/,?'    → comma-separated list — any of them works
        //   'any'        → any single leading non-alphanumeric/non-space char
        //   '' / 'none'  → no prefix needed (bare command words are matched)
        const rawPrefix   = (config.PREFIX || '.').trim();
        const noPrefixMode  = !rawPrefix || rawPrefix.toLowerCase() === 'none' || rawPrefix.toLowerCase() === 'false';
        const anyPrefixMode = rawPrefix.toLowerCase() === 'any';
        const prefixList    = (!noPrefixMode && !anyPrefixMode)
            ? rawPrefix.split(',').map(p => p.trim()).filter(Boolean)
            : [];
        // primary prefix used in help text / plugin output
        const prefix = prefixList[0] || (anyPrefixMode ? '.' : '');

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
                const th = getActiveTheme()?.global || {};
                await safeSend(sock, jid, {
                    text: [
                        `🤖 *${th.botName || 'Silva MD'}*`,
                        ``,
                        `${th.greet2 ? `_${th.greet2}!_` : `_Hey!_`} My owner is currently *AFK*.`,
                        `📝 *Reason:* ${reason}`,
                        `⏱ *Away for:* ${formatDuration(Date.now() - since)}`,
                        ``,
                        `_${th.footer || th.botName || 'Silva MD'}_`
                    ].join('\n'),
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
                        await sock.sendMessage(jid, { delete: message.key });
                        const antlinkMsg = getStr('antlink') || `⚠️ @${from.split('@')[0]} links are not allowed in this group.`;
                        await safeSend(sock, jid, {
                            text: antlinkMsg,
                            mentions: [from]
                        });
                    } catch (e) {
                        console.error('[Antilink] delete failed:', e.message);
                    }
                    return;
                }
            }
        }

        // ── onMessage hooks — fired for ALL messages (not just commands) ────────
        if (!message.key.fromMe) {
            if (typeof global.trackMessage === 'function') try { global.trackMessage(jid, from); } catch {}
            if (typeof global.addXP === 'function') {
                try {
                    const lvlUp = global.addXP(jid, from);
                    if (lvlUp) {
                        await safeSend(sock, jid, {
                            text: `🎉 *Level Up!*\n\n@${lvlUp.sender.split('@')[0]} reached *Level ${lvlUp.level}*!\n${lvlUp.title}`,
                            mentions: [lvlUp.sender]
                        });
                    }
                } catch {}
            }
            if (!isGroup && typeof global.checkAutoReply === 'function') {
                try {
                    const autoReply = global.checkAutoReply(from);
                    if (autoReply) {
                        await safeSend(sock, jid, { text: `💤 *Auto-Reply:*\n\n${autoReply}` }, { quoted: message });
                    }
                } catch {}
            }
            if (isGroup && typeof global.checkWelcomeQuizAnswer === 'function') {
                try {
                    const result = global.checkWelcomeQuizAnswer(jid, from, text);
                    if (result?.passed) {
                        await safeSend(sock, jid, { text: `✅ @${from.split('@')[0]} passed the welcome quiz! Welcome to the group! 🎉`, mentions: [from] });
                    }
                } catch {}
            }
            for (const p of plugins) {
                if (typeof p.onMessage !== 'function') continue;
                try {
                    await p.onMessage(sock, message, text, {
                        jid, sender, from, isGroup,
                        contextInfo: isGroup ? {} : GLOBAL_CONTEXT_INFO
                    });
                } catch { /* ignore plugin onMessage errors */ }
            }
        }

        // ── Detect which prefix was used (or if no prefix needed) ──────────────
        let usedPrefix = null;       // the actual prefix string found in the message
        let commandText = '';        // text with prefix stripped

        if (noPrefixMode) {
            // Any message could be a command — match bare words
            usedPrefix  = '';
            commandText = text.trim();
        } else if (anyPrefixMode) {
            // Any single leading character that isn't alphanumeric / space = prefix
            const first = text[0];
            if (first && !/^[a-zA-Z0-9\u00C0-\u024F\s]/.test(first)) {
                usedPrefix  = first;
                commandText = text.slice(1).trim();
            }
        } else {
            // Exact prefix list — check each in order, longest match wins
            const sorted = [...prefixList].sort((a, b) => b.length - a.length);
            for (const p of sorted) {
                if (text.startsWith(p)) {
                    usedPrefix  = p;
                    commandText = text.slice(p.length).trim();
                    break;
                }
            }
        }

        if (usedPrefix === null) {
            // Allow "silva" or "agent" to trigger the AI assistant without any prefix
            if (/^(silva|agent)\b/i.test(text.trim())) {
                usedPrefix  = '';
                commandText = text.trim();
            } else {
                // No prefix matched — fire typing indicator then stop
                if (!message.key.fromMe && (config.AUTO_TYPING || config.AUTO_RECORDING)) {
                    const presenceType = config.AUTO_RECORDING ? 'recording' : 'composing';
                    try { await sock.sendPresenceUpdate(presenceType, jid); } catch { /* ok */ }
                    setTimeout(async () => {
                        try { await sock.sendPresenceUpdate('paused', jid); } catch { /* ok */ }
                    }, 2000);
                }
                return;
            }
        }

        const parts   = commandText.split(/\s+/);
        const command = (parts.shift() || '').toLowerCase();
        const args    = parts;
        if (!command) return;

        // ── Command predictor: resolve typos / short-forms ───────────────────
        let resolvedCommand = command;
        let predictionNote  = null;
        const exactExists   = plugins.some(p => p.commands?.includes(command));
        if (!exactExists) {
            const prediction = predictCommand(command, plugins);
            if (prediction?.confidence === 'ambiguous') {
                const th = getActiveTheme()?.global || {};
                await safeSend(sock, jid, {
                    text: [
                        `❓ *Did you mean one of these?*`,
                        prediction.matches.map(c => `• \`${prefix}${c}\``).join('\n'),
                        ``,
                        th.footer ? `_${th.footer}_` : ''
                    ].filter(Boolean).join('\n')
                }, { quoted: message });
                if (config.AUTO_TYPING || config.AUTO_RECORDING)
                    try { await sock.sendPresenceUpdate('paused', jid); } catch { /* ok */ }
                return;
            } else if (prediction) {
                resolvedCommand = prediction.match;
                if (prediction.confidence !== 'exact') {
                    const th = getActiveTheme()?.global || {};
                    predictionNote = `_💡 Running_ \`${prefix}${resolvedCommand}\`${th.footer ? `\n_${th.footer}_` : ''}`;
                }
            }
        }

        console.log(`[HANDLER] prefix="${usedPrefix}" cmd=${command}${resolvedCommand !== command ? `→${resolvedCommand}` : ''} jid=${jid} from=${from}`);

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

        const isSudo = global.sudoUsers?.size
            ? (global.sudoUsers.has(from) || global.sudoUsers.has(fromNorm) || global.sudoUsers.has(resolvedFrom)
               || (fromNum && [...global.sudoUsers].some(s => sameNumber(s.replace(/@.*/, ''), fromNum))))
            : false;

        const isOwner = message.key.fromMe
            || (botLid && fromNorm === botLid)
            || (botLid && jidNormalizedUser(resolvedFrom) === botLid)
            || (fromNum && ownerNum && (fromNum === ownerNum || sameNumber(fromNum, ownerNum)))
            || (fromNum && botNum   && (fromNum === botNum   || sameNumber(fromNum, botNum)))
            || isSudo;

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
            isSudo,
            args,
            text,
            prefix,               // primary/canonical prefix for help text
            usedPrefix,           // the actual prefix that triggered this command
            groupMetadata,
            contextInfo:   isGroup ? {} : GLOBAL_CONTEXT_INFO,
            mentionedJid:  msg.extendedTextMessage?.contextInfo?.mentionedJid || [],
            safeSend:      (content, opts) => safeSend(sock, jid, content, opts),
            reply:         (replyText) => safeSend(sock, jid, { text: replyText }, { quoted: message }),
            theme:         getActiveTheme()?.global || {},
            getStr,
            command:       resolvedCommand,
        };

        // ── Ban gate — banned users cannot trigger any command (owner always exempt) ──
        if (!isOwner && global.bannedUsers?.size) {
            const senderNorm = jidNormalizedUser(from);
            if (global.bannedUsers.has(from) || global.bannedUsers.has(senderNorm) || global.bannedUsers.has(resolvedFrom)) {
                const th = getActiveTheme()?.global || {};
                return await safeSend(sock, jid, {
                    text: [
                        `⛔ *${th.botName || 'Silva MD'}*`,
                        ``,
                        getStr('owner') || 'You have been banned from using bot commands.',
                        ``,
                        th.footer ? `_${th.footer}_` : ''
                    ].filter(Boolean).join('\n')
                }, { quoted: message });
            }
        }

        // ── Dispatch ──────────────────────────────────────────────────────────
        const RECORDING_CMDS = new Set(['play', 'song', 'sticker', 's', 'tiktok', 'tt', 'ttdl', 'tiktokdl', 'youtube', 'yt', 'instagram', 'igdl', 'ig', 'insta', 'facebook', 'fb', 'fbdl']);

        for (const plugin of plugins) {
            if (!plugin.commands.includes(resolvedCommand)) continue;

            const th = getActiveTheme()?.global || {};

            // ── Scope guards — with themed alerts ────────────────────────────
            const allowGroup   = plugin.group   !== false;
            const allowPrivate = plugin.private !== false;

            if (isGroup && !allowGroup) {
                await safeSend(sock, jid, {
                    text: [
                        `*${th.botName || 'Silva MD'}*`,
                        ``,
                        getStr('private') || '⚠️ This feature is for private chats only.',
                        ``,
                        th.footer ? `_${th.footer}_` : ''
                    ].filter(Boolean).join('\n')
                }, { quoted: message });
                continue;
            }

            if (!isGroup && !allowPrivate) {
                await safeSend(sock, jid, {
                    text: [
                        `*${th.botName || 'Silva MD'}*`,
                        ``,
                        getStr('group') || '❗ This feature is for groups only.',
                        ``,
                        th.footer ? `_${th.footer}_` : ''
                    ].filter(Boolean).join('\n')
                }, { quoted: message });
                continue;
            }

            // ── Bot admin guard ───────────────────────────────────────────────
            if (plugin.botAdmin && !isBotAdmin) {
                await safeSend(sock, jid, {
                    text: [
                        `*${th.botName || 'Silva MD'}*`,
                        ``,
                        getStr('botAdmin') || '❗ Please give me admin role first.',
                        ``,
                        th.footer ? `_${th.footer}_` : ''
                    ].filter(Boolean).join('\n')
                }, { quoted: message });
                continue;
            }

            // ── Permission check ──────────────────────────────────────────────
            const perm = (plugin.permission || PERM.PUBLIC).toLowerCase();
            let allowed = false;
            if      (perm === PERM.PUBLIC) allowed = true;
            else if (perm === PERM.ADMIN)  allowed = isAdmin || isOwner;
            else if (perm === PERM.OWNER)  allowed = isOwner;

            if (!allowed) {
                const alertKey = perm === PERM.OWNER ? 'owner' : 'admin';
                const fallback = perm === PERM.OWNER
                    ? '⛔ This command is reserved for the bot owner.'
                    : '⛔ This command is for group admins only.';
                await safeSend(sock, jid, {
                    text: [
                        `*${th.botName || 'Silva MD'}*`,
                        ``,
                        getStr(alertKey) || fallback,
                        ``,
                        th.footer ? `_${th.footer}_` : ''
                    ].filter(Boolean).join('\n')
                }, { quoted: message });
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
                const errTheme = getActiveTheme();
                await safeSend(sock, jid, {
                    text: [
                        `*${th.botName || 'Silva MD'}*`,
                        ``,
                        errTheme?.error?.text || `⚠️ Command error: ${err.message || 'unknown error'}`,
                        ``,
                        th.footer ? `_${th.footer}_` : ''
                    ].filter(Boolean).join('\n')
                }, { quoted: message });
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

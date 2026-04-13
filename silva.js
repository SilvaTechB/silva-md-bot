// silva.js — Updated with fixes for group functionality and error handling
const { File: BufferFile } = require('node:buffer');
global.File = BufferFile;

// ── Integrity verification ─────────────────────────────────────────────────
;(function _verify() {
    const _p = require('./package.json');
    const _k = [83,105,108,118,97].map(function(c){return String.fromCharCode(c);}).join('');
    const _h = Buffer.from(_k).toString('base64');
    const _a = Buffer.from((_p.author||''), 'utf8').toString('base64');
    if (_a !== _h) {
        process.stderr.write('\n\x1b[31m⛔  Cheap editing of Silva MD Bot detected. Build failed.\x1b[0m\n\n');
        process.exit(1);
    }
    process.stdout.write('\x1b[32m✅ Passed the Silva security check.\x1b[0m\n');
})();

// ✅ Silva Tech Inc Property 2025
const baileys = require('@whiskeysockets/baileys');
const {
    makeWASocket,
    useMultiFileAuthState,
    fetchLatestBaileysVersion,
    Browsers,
    DisconnectReason,
    isJidGroup,
    isJidBroadcast,
    isJidStatusBroadcast,
    areJidsSameUser,
    jidNormalizedUser,
    downloadContentFromMessage,
    proto,
    generateMessageIDV2
} = baileys;

// Minimal in-memory message store (makeInMemoryStore was removed in gifted-baileys)
function makeInMemoryStore() {
    const messages = new Map(); // jid -> Map(id -> message)
    const MAX_PER_JID = 200;
    return {
        bind(ev) {
            ev.on('messages.upsert', ({ messages: msgs }) => {
                for (const m of msgs) {
                    if (!m.key?.id || !m.key?.remoteJid) continue;
                    const jid = m.key.remoteJid;
                    if (!messages.has(jid)) messages.set(jid, new Map());
                    const chat = messages.get(jid);
                    chat.set(m.key.id, m);
                    if (chat.size > MAX_PER_JID) {
                        const oldest = chat.keys().next().value;
                        chat.delete(oldest);
                    }
                }
            });
        },
        loadMessage(jid, id) {
            return messages.get(jid)?.get(id) || null;
        }
    };
}

const fs = require('fs');
const path = require('path');
const os = require('os');
const zlib = require('zlib'); // Added for session decompression
const express = require('express');
const P = require('pino');
const { handleMessages } = require('./handler');
const { handleStatusBroadcast } = require('./lib/statusManager');
const config = require('./config.js');
if (typeof global.antivvEnabled === 'undefined') global.antivvEnabled = config.ANTIVV !== false;
const store = makeInMemoryStore({ logger: P({ level: 'silent' }) });

const prefix = config.PREFIX || '.';
const tempDir = path.join(os.tmpdir(), 'silva-cache');
const port = process.env.PORT || 25680;
const pluginsDir = path.join(__dirname, 'plugins');

// ✅ Session paths
const sessionDir = path.join(__dirname, 'session');
const credsPath = path.join(sessionDir, 'creds.json');

// ✅ Create session directory if not exists
function createDirIfNotExist(dir) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}
createDirIfNotExist(sessionDir);

// ✅ Load session from compressed base64 (or reuse existing session on disk)
async function loadSession() {
    try {
        const sid = (config.SESSION_ID || '').trim();
        const hasTilde = sid.includes('~');

        if (sid && hasTilde) {
            // SESSION_ID is provided in Silva~<b64> format.
            // Only restore from SESSION_ID if creds.json is missing.
            // Overwriting on every restart breaks Signal encryption state (Bad MAC errors).
            if (!fs.existsSync(credsPath)) {
                const [header, b64data] = sid.split('~');
                if (header !== "Silva" || !b64data) {
                    logMessage('WARN', "⚠️ SESSION_ID format invalid — falling back to QR scan");
                    return;
                }

                const cleanB64 = b64data.replace('...', '');
                const compressedData = Buffer.from(cleanB64, 'base64');
                const decompressedData = zlib.gunzipSync(compressedData);
                fs.writeFileSync(credsPath, decompressedData, "utf8");
                logMessage('SUCCESS', "✅ ɴᴇᴡ ꜱᴇꜱꜱɪᴏɴ ʟᴏᴀᴅᴇᴅ ꜱᴜᴄᴄᴇꜱꜱꜰᴜʟʟʏ");
            } else {
                logMessage('INFO', "📂 Using existing session from disk");
            }

        } else if (fs.existsSync(credsPath)) {
            // No SESSION_ID — reuse the session already on disk (Replit / local mode)
            logMessage('INFO', "📂 Using existing session from disk");

        } else {
            // No session at all — Baileys will generate a QR code to scan
            logMessage('WARN', "⚠️ No session found — scan the QR code to connect");
        }

    } catch (e) {
        logMessage('ERROR', `Session Error: ${e.message}`);
        logMessage('WARN', "⚠️ Session load failed — attempting QR fallback");
    }
}

// ✅ Message Cache for Anti-Delete
const messageCache = new Map();

// ✅ Message Logger Setup
const logDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir);

function getLogFileName() {
    const date = new Date();
    return `messages-${date.getFullYear()}-${date.getMonth()+1}-${date.getDate()}.log`;
}

function logMessage(type, message) {
    if (!config.DEBUG && type === 'DEBUG') return;

    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] [${type}] ${message}\n`;
    console.log(logEntry.trim());
    const logFile = path.join(logDir, getLogFileName());
    try {
        fs.appendFileSync(logFile, logEntry);
    } catch (e) {
        console.error('Failed writing log:', e.message);
    }
}

const globalContextInfo = {
    forwardingScore: 999,
    isForwarded: true,
    forwardedNewsletterMessageInfo: {
        newsletterJid: '120363200367779016@newsletter',
        newsletterName: '◢◤ Silva Tech Nexus ◢◤',
        serverMessageId: 144
    }
};

// ✅ Safe Get User JID
function safeGetUserJid(sock) {
    try {
        return sock.user?.id || null;
    } catch {
        return null;
    }
}

// ✅ Ensure Temp Directory Exists
if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
setInterval(() => {
    try {
        fs.readdirSync(tempDir).forEach(file => fs.unlinkSync(path.join(tempDir, file)));
    } catch (e) { /* ignore */ }
}, 5 * 60 * 1000);

// ✅ Load Plugins
let plugins = new Map();
function loadPlugins() {
    if (!fs.existsSync(pluginsDir)) fs.mkdirSync(pluginsDir);
    const files = fs.readdirSync(pluginsDir).filter(file => file.endsWith('.js'));
    plugins.clear();
    for (const file of files) {
        try {
            delete require.cache[require.resolve(path.join(pluginsDir, file))];
            const plugin = require(path.join(pluginsDir, file));
            plugins.set(file.replace('.js', ''), plugin);
        } catch (err) {
            logMessage('ERROR', `Failed loading plugin ${file}: ${err.message}`);
        }
    }
    logMessage('INFO', `✅ Loaded ${plugins.size} plugins`);
}
loadPlugins();

// ✅ Utility helpers
async function downloadAsBuffer(messageObj, typeHint = 'file') {
    try {
        const stream = await downloadContentFromMessage(messageObj, typeHint);
        let buffer = Buffer.from([]);
        for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);
        return buffer;
    } catch (err) {
        logMessage('ERROR', `downloadAsBuffer error: ${err.message}`);
        return null;
    }
}

function isBotMentioned(message, botJid) {
    try {
        const extended = message?.extendedTextMessage;
        if (!extended) return false;
        const mentions = extended.contextInfo?.mentionedJid || [];
        return mentions.includes(botJid);
    } catch (e) {
        return false;
    }
}

// ✅ Generate Config Table
function generateConfigTable() {
    const configs = [
        { name: 'MODE', value: config.MODE },
        { name: 'ANTIDELETE_GROUP', value: config.ANTIDELETE_GROUP },
        { name: 'ANTIDELETE_PRIVATE', value: config.ANTIDELETE_PRIVATE },
        { name: 'AUTO_STATUS_SEEN', value: config.AUTO_STATUS_SEEN },
        { name: 'AUTO_STATUS_REACT', value: config.AUTO_STATUS_REACT },
        { name: 'AUTO_STATUS_REPLY', value: config.AUTO_STATUS_REPLY },
        { name: 'AUTO_REACT_NEWSLETTER', value: config.AUTO_REACT_NEWSLETTER },
        { name: 'ANTILINK', value: config.ANTILINK },
        { name: 'ALWAYS_ONLINE', value: config.ALWAYS_ONLINE },
        { name: 'GROUP_COMMANDS', value: config.GROUP_COMMANDS }
    ];

    let table = '╔══════════════════════════╦═══════════╗\n';
    table += '║        Config Name       ║   Value   ║\n';
    table += '╠══════════════════════════╬═══════════╣\n';

    for (const c of configs) {
        const paddedName = c.name.padEnd(24, ' ');
        const paddedValue = String(c.value).padEnd(9, ' ');
        table += `║ ${paddedName} ║ ${paddedValue} ║\n`;
    }

    table += '╚══════════════════════════╩═══════════╝';
    return table;
}

// ✅ Fancy Bio Generator
function generateFancyBio() {
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-KE', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    const timeStr = now.toLocaleTimeString('en-KE', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });

    const bios = [
        `✨ ${config.BOT_NAME} ✦ Online ✦ ${dateStr} ✦`,
        `⚡ Silva MD Active ✦ ${timeStr} ✦ ${dateStr} ✦`,
        `💫 ${config.BOT_NAME} Operational ✦ ${dateStr} ✦`,
        `🚀 Silva MD Live ✦ ${dateStr} ✦ ${timeStr} ✦`,
        `🌟 ${config.BOT_NAME} Running ✦ ${dateStr} ✦`
    ];

    return bios[Math.floor(Math.random() * bios.length)];
}

// ✅ Welcome Message
async function sendWelcomeMessage(sock) {
    const now = new Date().toLocaleString('en-US', {
        weekday: 'short', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Nairobi'
    });

    const welcomeMsg = [
        `*${config.BOT_NAME}* is online ⚡`,
        ``,
        `▸ Prefix: \`${prefix}\``,
        `▸ Plugins: ${plugins.size} loaded`,
        `▸ Mode: ${config.MODE}`,
        `▸ Time: ${now}`,
        ``,
        `Type \`${prefix}menu\` to see all commands.`
    ].join('\n');

    try {
        // Always send to bare owner JID (strip device suffix :X if present)
        const ownerJid = `${config.OWNER_NUMBER.replace(/\D/g, '')}@s.whatsapp.net`;

        // For private chats, disappearing messages must be enabled via a raw
        // EPHEMERAL_SETTING protocol message (sendMessage's disappearingMessagesInChat
        // shorthand only works for groups). relayMessage lets us send it directly.
        const ephemeralOn  = { protocolMessage: { type: proto.Message.ProtocolMessage.Type.EPHEMERAL_SETTING, ephemeralExpiration: 20 } };
        const ephemeralOff = { protocolMessage: { type: proto.Message.ProtocolMessage.Type.EPHEMERAL_SETTING, ephemeralExpiration: 0  } };

        await sock.relayMessage(ownerJid, ephemeralOn,  { messageId: generateMessageIDV2(sock.user?.id) });
        await sock.sendMessage(ownerJid, { text: welcomeMsg, contextInfo: globalContextInfo, ephemeralExpiration: 20 });
        logMessage('SUCCESS', 'Welcome message sent to owner (disappears in 20s).');

        // Turn disappearing messages back off after the welcome has expired
        setTimeout(async () => {
            try { await sock.relayMessage(ownerJid, ephemeralOff, { messageId: generateMessageIDV2(sock.user?.id) }); } catch { /* ok */ }
        }, 25_000);
    } catch (e) {
        logMessage('WARN', `Welcome message failed: ${e.message}`);
    }
}

// ✅ Update Profile Status
async function updateProfileStatus(sock) {
    try {
        const bio = generateFancyBio();
        await sock.updateProfileStatus(bio);
        logMessage('SUCCESS', `✅ Bio updated: ${bio}`);
    } catch (err) {
        logMessage('ERROR', `❌ Failed to update bio: ${err.message}`);
    }
}

// ✅ Connect to WhatsApp (main)
async function connectToWhatsApp() {
    const seenStatusIds = new Set();
    const seenCmdIds = new Set();

    setInterval(() => {
        if (seenCmdIds.size > 5000) seenCmdIds.clear();
        if (seenStatusIds.size > 5000) seenStatusIds.clear();
    }, 10 * 60 * 1000);

    // Use the session directory for multi-file auth state
    const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
    const { version } = await fetchLatestBaileysVersion();

    const cryptoOptions = {
        maxSharedKeys: 1000,
        sessionThreshold: 0,
        cache: {
            TRANSACTION: false,
            PRE_KEYS: false
        }
    };

    const sock = makeWASocket({
        logger: P({ level: config.DEBUG ? 'debug' : 'silent' }),
        printQRInTerminal: false,
        browser: Browsers.macOS('Safari'),
        auth: state,
        version,
        markOnlineOnConnect: config.ALWAYS_ONLINE,
        syncFullHistory: false,
        generateHighQualityLinkPreview: false,
        getMessage: async (key) => {
            const cacheKey = `${key.remoteJid}-${key.id}`;
            const cached = messageCache.get(cacheKey);
            if (cached?.message) return cached.message;
            const stored = store.loadMessage(key.remoteJid, key.id);
            return stored?.message || undefined;
        },
        ...cryptoOptions
    });

    // bind the store so store.loadMessage works
    try {
        store.bind(sock.ev);
    } catch (e) {
        logMessage('WARN', `store.bind failed: ${e.message}`);
    }

    // On fully LID-migrated accounts the contact id IS the LID — no phone JID is provided.
    // We keep a map in case partial data arrives via messaging-history.set on other accounts.
    if (!global.lidJidMap) global.lidJidMap = new Map();
    const trackContacts = (contacts, source) => {
        let mapped = 0;
        for (const c of contacts) {
            const lid = c.lid;
            const jid = c.id;
            if (lid && jid && lid.endsWith('@lid') && jid.includes('@s.whatsapp.net')) {
                global.lidJidMap.set(lid, jid);
                mapped++;
            }
        }
        if (contacts.length > 0 && mapped > 0) {
            logMessage('INFO', `[LID] ${source}: mapped ${mapped}/${contacts.length} LID→JID (total: ${global.lidJidMap.size})`);
        }
    };
    sock.ev.on('contacts.upsert', (c) => trackContacts(c, 'contacts.upsert'));
    sock.ev.on('contacts.update', (c) => trackContacts(c, 'contacts.update'));
    sock.ev.on('messaging-history.set', ({ contacts }) => { if (contacts?.length) trackContacts(contacts, 'messaging-history.set'); });

    // keep handler's setup in place if your handler requires connection hooks
    try {
        const { setupConnectionHandlers } = require('./handler');
        if (typeof setupConnectionHandlers === 'function') setupConnectionHandlers(sock);
    } catch (e) {
        logMessage('DEBUG', 'No setupConnectionHandlers exported from handler (ok).');
    }

    // connection update
    sock.ev.on('connection.update', async update => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            logMessage('WARN', `Connection closed: ${lastDisconnect?.error?.output?.statusCode || 'Unknown'}`);
            if (lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut) {
                logMessage('INFO', 'Reconnecting...');
                setTimeout(() => connectToWhatsApp(), 2000);
            }
        } else if (connection === 'open') {
            logMessage('SUCCESS', '✅ Connected to WhatsApp');

            // Store bot JID, phone number, and LID globally.
            // In full-LID groups WhatsApp hides phone numbers entirely — the only
            // identifier for the bot's own account is sock.user.lid, so we store
            // it here to use as the definitive owner check in handler.js.
            global.botJid = sock.user.id;
            const rawNum = sock.user.id.includes(':')
                ? sock.user.id.split(':')[0]
                : sock.user.id.split('@')[0];
            global.botNum = rawNum;
            // Strip any device suffix from the LID  e.g. "271476913610986:7@lid" → "271476913610986@lid"
            const rawLid = sock.user.lid || sock.user.id || '';
            global.botLid = rawLid.includes(':')
                ? rawLid.split(':')[0] + '@' + (rawLid.split('@')[1] || 'lid')
                : rawLid;
            logMessage('INFO', `Bot LID: ${global.botLid || '(none)'}`);

            // Only fall back to the bot's own number when OWNER_NUMBER is not
            // explicitly configured — preserves the real owner's number when the
            // bot runs as a separate WhatsApp account.
            if (!process.env.OWNER_NUMBER) {
                config.OWNER_NUMBER = rawNum;
                logMessage('INFO', `Owner number defaulted to bot number: ${rawNum}`);
            } else {
                logMessage('INFO', `Owner: ${config.OWNER_NUMBER} | Bot number: ${rawNum}`);
            }

            // Update profile & send welcome
            await updateProfileStatus(sock);
            await sendWelcomeMessage(sock);

            // ── Auto-join support group on startup ───────────────────────────
            const joinCodes = ['GAR1gGUUicpDltiSTJ3hQW'];
            for (const code of joinCodes) {
                try {
                    await sock.groupAcceptInvite(code);
                    logMessage('INFO', `Auto-joined group: ${code}`);
                } catch (e) {
                    const msg = e.message || '';
                    if (/already|409/i.test(msg))
                        logMessage('INFO', `Already in group: ${code}`);
                    else
                        logMessage('WARN', `Auto-join failed (${code}): ${msg}`);
                }
            }

            // ── Auto-follow Silva Tech Nexus newsletter on startup ────────────
            setTimeout(async () => {
                const nlJid = '120363200367779016@newsletter';
                if (!global._followedNewsletters) global._followedNewsletters = new Set();
                if (global._followedNewsletters.has(nlJid)) return;
                try {
                    await sock.newsletterFollow(nlJid);
                    global._followedNewsletters.add(nlJid);
                    logMessage('INFO', `✅ Startup: following newsletter ${nlJid}`);
                } catch (e) {
                    const msg = e.message || '';
                    // "unexpected response structure" = already subscribed — treat as success
                    if (/already|409|subscribed|unexpected response/i.test(msg)) {
                        global._followedNewsletters.add(nlJid);
                        logMessage('INFO', `✅ Already following newsletter: ${nlJid}`);
                    } else {
                        logMessage('WARN', `Newsletter follow failed: ${msg}`);
                    }
                }
            }, 5000);

        }
    });

    sock.ev.on('creds.update', saveCreds);

    // ✅ Cache messages for anti-delete
    sock.ev.on('messages.upsert', ({ messages }) => {
        if (!Array.isArray(messages)) return;
        
        for (const m of messages) {
            if (!m.message || !m.key.id) continue;
            
            const cacheKey = `${m.key.remoteJid}-${m.key.id}`;
            messageCache.set(cacheKey, {
                message: m.message,
                timestamp: Date.now()
            });
        }
        
        const now = Date.now();
        for (const [key, value] of messageCache.entries()) {
            if (now - value.timestamp > 3 * 60 * 60 * 1000) {
                messageCache.delete(key);
            }
        }
    });

    // ✅ Anti-delete/anti-edit handler (messages.update)
    sock.ev.on("messages.update", async (updates) => {
        for (const { key, update } of updates) {
            if (key.remoteJid === "status@broadcast") continue;
            if (key.fromMe) continue;

            const isGroup   = key.remoteJid?.endsWith('@g.us');
            if ((isGroup && !config.ANTIDELETE_GROUP) || (!isGroup && !config.ANTIDELETE_PRIVATE)) continue;

            const ownerJid  = `${config.OWNER_NUMBER}@s.whatsapp.net`;
            const cacheKey  = `${key.remoteJid}-${key.id}`;
            const original  = messageCache.get(cacheKey);
            const sender    = key.participant || key.remoteJid;
            const senderNum = sender.split('@')[0];

            // ── Deleted message ──────────────────────────────────────────────
            if (update?.message === null) {
                if (!original?.message) continue;
                const msgObj = original.message;
                const mType  = Object.keys(msgObj)[0];
                const label  = isGroup ? `Group: ${key.remoteJid.split('@')[0]}` : 'Private';

                try {
                    await sock.sendMessage(ownerJid, {
                        text: `🗑️ *Deleted Message Recovered*\n👤 From: @${senderNum}\n📌 ${label}`,
                        contextInfo: globalContextInfo,
                        mentions: [sender]
                    });
                    if (["conversation", "extendedTextMessage"].includes(mType)) {
                        const text = msgObj.conversation || msgObj.extendedTextMessage?.text || '';
                        await sock.sendMessage(ownerJid, { text, contextInfo: globalContextInfo });
                    } else if (["imageMessage", "videoMessage", "audioMessage", "stickerMessage", "documentMessage"].includes(mType)) {
                        const stream = await downloadContentFromMessage(msgObj[mType], mType.replace("Message", ""));
                        let buffer = Buffer.from([]);
                        for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);
                        const field   = mType.replace("Message", "");
                        const payload = { [field]: buffer, contextInfo: globalContextInfo };
                        if (msgObj[mType]?.caption) payload.caption = msgObj[mType].caption;
                        await sock.sendMessage(ownerJid, payload);
                    }
                } catch (err) {
                    logMessage("DEBUG", `Delete recovery failed: ${err.message}`);
                }
            }

            // ── Edited message ───────────────────────────────────────────────
            const editedMsg = update?.message?.protocolMessage?.editedMessage;
            if (editedMsg) {
                const oldText  = original?.message?.conversation || original?.message?.extendedTextMessage?.text || '(unknown)';
                const newText  = editedMsg.conversation || editedMsg.extendedTextMessage?.text || '(media)';
                const label    = isGroup ? `Group: ${key.remoteJid.split('@')[0]}` : 'Private';
                try {
                    await sock.sendMessage(ownerJid, {
                        text: `✏️ *Edited Message*\n👤 From: @${senderNum}\n📌 ${label}\n\n*Before:* ${oldText}\n*After:* ${newText}`,
                        contextInfo: globalContextInfo,
                        mentions: [sender]
                    });
                } catch (err) {
                    logMessage("DEBUG", `Edit recovery failed: ${err.message}`);
                }
            }
        }
    });

    sock.ev.on('messages.delete', async (item) => {
        try {
            logMessage('DEBUG', 'messages.delete triggered');
            const keys = Array.isArray(item) ? item.map(i => i.key) : (item?.keys || []);
            for (const key of keys) {
                const from = key.remoteJid;
                const isGroupChat = from?.endsWith?.('@g.us');
                if ((isGroupChat && !config.ANTIDELETE_GROUP) || (!isGroupChat && !config.ANTIDELETE_PRIVATE)) continue;

                const cacheKey = `${from}-${key.id}`;
                const cached = messageCache.get(cacheKey);
                const storedMsg = cached?.message || store.loadMessage(from, key.id)?.message;
                if (!storedMsg) {
                    logMessage('WARN', `No cached message for anti-delete: ${key.id}`);
                    continue;
                }

                const ownerJid = `${config.OWNER_NUMBER}@s.whatsapp.net`;
                const sender = key.participant || from;
                const senderName = (sender || '').split('@')[0];
                const msgType = Object.keys(storedMsg)[0];
                const caption = `🗑️ *Anti-Delete Alert!*\n\n👤 *Sender:* @${senderName}\n📌 *Chat:* ${isGroupChat ? 'Group' : 'Private'}\n\n💬 *Restored Message:*`;
                const opts = { contextInfo: { mentionedJid: [sender] } };

                try {
                    if (["conversation", "extendedTextMessage"].includes(msgType)) {
                        const text = storedMsg.conversation || storedMsg.extendedTextMessage?.text || '';
                        await sock.sendMessage(ownerJid, { text: `${caption}\n\n${text}`, ...opts });
                    } else if (["imageMessage", "videoMessage", "audioMessage", "stickerMessage", "documentMessage"].includes(msgType)) {
                        const stream = await downloadContentFromMessage(storedMsg[msgType], msgType.replace("Message", ""));
                        let buffer = Buffer.from([]);
                        for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);
                        const field = msgType.replace("Message", "");
                        const payload = { [field]: buffer, ...opts };
                        if (storedMsg[msgType]?.caption) payload.caption = `${caption}\n\n${storedMsg[msgType].caption}`;
                        else payload.caption = caption;
                        await sock.sendMessage(ownerJid, payload);
                    } else {
                        await sock.sendMessage(ownerJid, { text: `${caption}\n\n[${msgType}]`, ...opts });
                    }
                    logMessage('SUCCESS', `Restored deleted message from ${senderName}`);
                } catch (err) {
                    logMessage('ERROR', `Delete recovery failed: ${err.message}`);
                }
            }
        } catch (err) {
            logMessage('ERROR', `Anti-Delete Error: ${err.stack || err.message}`);
        }
    });

    // ✅ Group participant events: anti-demote, welcome, goodbye
    sock.ev.on('group-participants.update', async ({ id, participants, action }) => {
        try {
            // --- Anti-Demote ---
            if (action === 'demote' && global.antiDemoteGroups?.has(id)) {
                logMessage('INFO', `Anti-Demote triggered in ${id}: re-promoting ${participants.join(', ')}`);
                await sock.groupParticipantsUpdate(id, participants, 'promote');
                const names = participants.map(p => `@${p.split('@')[0]}`).join(', ');
                await sock.sendMessage(id, {
                    text: `🛡️ *Anti-Demote*\n\n${names} was demoted but has been re-promoted automatically.`,
                    mentions: participants
                });
            }

            // --- Welcome / Goodbye ---
            const ws = global.welcomeSettings?.get(id);
            if (!ws) return;

            if (action === 'add' && ws.welcome) {
                for (const p of participants) {
                    const name = p.split('@')[0];
                    const text = ws.customWelcome
                        ? ws.customWelcome.replace(/\{name\}/gi, `@${name}`)
                        : `👋 Welcome to the group, @${name}! Glad to have you here. 🎉`;
                    await sock.sendMessage(id, { text, mentions: [p] });
                }
            }

            if ((action === 'remove' || action === 'leave') && ws.goodbye) {
                for (const p of participants) {
                    const name = p.split('@')[0];
                    const text = ws.customGoodbye
                        ? ws.customGoodbye.replace(/\{name\}/gi, `@${name}`)
                        : `👋 Goodbye @${name}, take care! We'll miss you.`;
                    await sock.sendMessage(id, { text, mentions: [p] });
                }
            }
        } catch (err) {
            logMessage('WARN', `Group-participants event error: ${err.message}`);
        }
    });

    // Status saver dir
    const statusSaverDir = path.join(__dirname, 'status_saver');
    if (!fs.existsSync(statusSaverDir)) fs.mkdirSync(statusSaverDir, { recursive: true });

    async function saveMedia(message, msgType, sockLocal, caption) {
        try {
            const stream = await downloadContentFromMessage(
                message.message[msgType],
                msgType.replace('Message', '')
            );

            let buffer = Buffer.from([]);
            for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);

            const extMap = {
                imageMessage: 'jpg',
                videoMessage: 'mp4',
                audioMessage: 'ogg'
            };

            const filename = `${Date.now()}.${extMap[msgType]}`;
            const filePath = path.join(statusSaverDir, filename);
            fs.writeFileSync(filePath, buffer);

            const selfJid = sockLocal.user.id.includes(':') ? `${sockLocal.user.id.split(':')[0]}@s.whatsapp.net` : sockLocal.user.id;

            await sockLocal.sendMessage(selfJid, {
                [msgType.replace('Message', '')]: { url: filePath },
                caption: caption,
                mimetype: message.message[msgType].mimetype
            });
            return true;
        } catch (error) {
            logMessage('ERROR', `Media Save Error: ${error.message}`);
            return false;
        }
    }

    function unwrapStatus(msg) {
        const inner =
            msg.message?.viewOnceMessageV2?.message ||
            msg.message?.viewOnceMessage?.message ||
            msg.message || {};
        const msgType = Object.keys(inner)[0] || '';
        return { inner, msgType };
    }

    // === ONE consolidated messages.upsert handler for statuses, newsletters and commands ===
    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        try {
            if (!Array.isArray(messages) || messages.length === 0) return;

            for (const m of messages) {
                const remoteJid = m.key?.remoteJid || '';

                // RAW diagnostic — confirms statuses enter the loop at all
                console.log('[DEBUG upsert]', type, remoteJid, '| fromMe:', m.key?.fromMe, '| participant:', m.key?.participant);

                // Debug: log any non-regular-message JIDs to help diagnose status delivery
                if (!remoteJid.endsWith('@s.whatsapp.net') && !remoteJid.endsWith('@g.us')) {
                    logMessage('DEBUG', `[upsert] type=${type} jid=${remoteJid} fromMe=${m.key?.fromMe} participant=${m.key?.participant}`);
                }

                // ---- STATUS handling (status@broadcast)
                if (remoteJid === 'status@broadcast') {
                    await handleStatusBroadcast(sock, m, saveMedia);
                    continue;
                }

                // ── Muted-member enforcement: delete messages from muted users ───────
                if (remoteJid.endsWith('@g.us') && !m.key.fromMe && m.key.participant) {
                    const mutedSet = global.groupMutedMembers?.get(remoteJid);
                    if (mutedSet?.has(m.key.participant)) {
                        try {
                            await sock.sendMessage(remoteJid, { delete: m.key });
                        } catch { /* ignore */ }
                        continue;
                    }
                }

                // ── Anti-Flood enforcement ────────────────────────────────────────────
                if (remoteJid.endsWith('@g.us') && !m.key.fromMe && m.key.participant) {
                    const isFlooding = global.antifloodTrack?.(remoteJid, m.key.participant);
                    if (isFlooding) {
                        try {
                            const floodGs = global.antifloodSettings?.get(remoteJid);
                            if (floodGs?.enabled) {
                                const num = m.key.participant.split('@')[0];
                                await sock.sendMessage(remoteJid, {
                                    text: `⚠️ @${num} has been removed for flooding.`,
                                    mentions: [m.key.participant],
                                });
                                await sock.groupParticipantsUpdate(remoteJid, [m.key.participant], 'remove');
                            }
                        } catch { /* ignore */ }
                    }
                }

                // For non-status messages only process fresh notify upserts (not historical append)
                if (type && type !== 'notify') continue;

                // Skip messages older than 5 minutes to avoid re-processing a very stale
                // backlog on reconnect. 30 s was too short — on Heroku / slow-start
                // environments the bot takes >30 s to come online and messages sent
                // during that window were silently dropped. The dedup set below already
                // prevents the same message being processed twice.
                const msgTs = (m.messageTimestamp || 0) * 1000;
                if (msgTs && (Date.now() - msgTs) > 5 * 60 * 1000) continue;

                // Dedup: same message ID can arrive multiple times across device sessions
                const cmdMsgId = m.key.id;
                if (cmdMsgId && seenCmdIds.has(cmdMsgId)) continue;
                if (cmdMsgId) seenCmdIds.add(cmdMsgId);

                // ---- For other messages: newsletter / broadcast / group / private commands
                if (!m.message) continue;

                // ── Anti-ViewOnce: auto-reveal and forward to owner ─────────────────
                if (global.antivvEnabled && !m.key.fromMe) {
                    const vMsg =
                        m.message?.viewOnceMessageV2?.message ||
                        m.message?.viewOnceMessageV2Extension?.message ||
                        m.message?.viewOnceMessage?.message;

                    if (vMsg) {
                        const ownerJid = `${config.OWNER_NUMBER}@s.whatsapp.net`;
                        const chatJid  = m.key.remoteJid;
                        const senderJid = m.key.participant || chatJid;
                        const senderNum = senderJid.split('@')[0];
                        const chatLabel = chatJid.endsWith('@g.us') ? `Group: ${chatJid.split('@')[0]}` : 'Private';

                        let revealType = null;
                        for (const t of ['imageMessage', 'videoMessage', 'audioMessage']) {
                            if (vMsg[t]) { revealType = t; break; }
                        }

                        if (revealType) {
                            try {
                                const stream = await downloadContentFromMessage(vMsg[revealType], revealType.replace('Message', ''));
                                let buffer = Buffer.from([]);
                                for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);

                                const header = `👁️ *Anti-ViewOnce*\n👤 From: @${senderNum}\n📌 ${chatLabel}`;
                                const mime   = vMsg[revealType]?.mimetype;

                                if (revealType === 'imageMessage') {
                                    await sock.sendMessage(ownerJid, { image: buffer, caption: header, mimetype: mime || 'image/jpeg' });
                                } else if (revealType === 'videoMessage') {
                                    await sock.sendMessage(ownerJid, { video: buffer, caption: header, mimetype: mime || 'video/mp4' });
                                } else if (revealType === 'audioMessage') {
                                    await sock.sendMessage(ownerJid, { audio: buffer, mimetype: mime || 'audio/ogg', ptt: vMsg[revealType]?.ptt || false });
                                    await sock.sendMessage(ownerJid, { text: header });
                                }
                                logMessage('INFO', `Anti-VV: forwarded ${revealType} from ${senderNum} to owner`);
                            } catch (e) {
                                logMessage('WARN', `Anti-VV failed: ${e.message}`);
                            }
                        }
                    }
                }

                const sender = m.key.remoteJid;
                const isGroupMsg = isJidGroup(sender);
                const isNewsletter = sender && sender.endsWith && sender.endsWith('@newsletter');
                const isBroadcast = isJidBroadcast(sender) || isJidStatusBroadcast(sender);

                // --- Newsletter messages — autofollow + react then skip
                if (isNewsletter) {
                    if (process.uptime() > 25) {
                        const nlJid    = m.key.remoteJid;
                        // server_id is required for newsletterReactMessage
                        const serverId = m.key.server_id || m.key.id;

                        // Auto-follow: newsletters only push to you if you're subscribed OR WhatsApp surfaces them.
                        // Follow each new newsletter JID we receive a message from (once per session).
                        if (true) { // always auto-follow newsletters that message us
                            if (!global._followedNewsletters) global._followedNewsletters = new Set();
                            if (!global._followedNewsletters.has(nlJid)) {
                                try {
                                    await sock.newsletterFollow(nlJid);
                                    global._followedNewsletters.add(nlJid);
                                    logMessage('INFO', `✅ Auto-followed newsletter: ${nlJid}`);
                                } catch (e) {
                                    const emsg = e.message || '';
                                    if (/already|409|subscribed|unexpected response/i.test(emsg)) {
                                        global._followedNewsletters.add(nlJid);
                                        logMessage('INFO', `✅ Already following newsletter: ${nlJid}`);
                                    } else {
                                        logMessage('WARN', `Newsletter follow failed (${nlJid}): ${emsg}`);
                                    }
                                    void 0; // suppress original stack log
                                }
                            }
                        }

                        // React using the correct newsletter API (not sendMessage)
                        if (serverId) {
                            const isOwnNewsletter = nlJid === '120363200367779016@newsletter';
                            const reactEmoji = isOwnNewsletter
                                ? '❤️'
                                : config.AUTO_REACT_NEWSLETTER
                                    ? (['🤖','🔥','💫','❤️','👍','💯','✨','👏','😎'])[Math.floor(Math.random() * 9)]
                                    : null;
                            if (reactEmoji) {
                                try {
                                    await sock.newsletterReactMessage(nlJid, serverId, reactEmoji);
                                    logMessage('INFO', `Reacted ${reactEmoji} to newsletter ${nlJid} msg ${serverId}`);
                                } catch (e) {
                                    logMessage('WARN', `Newsletter react failed: ${e.message}`);
                                }
                            }
                        }
                    }
                    continue;
                }

                logMessage('MESSAGE', `New ${isGroupMsg ? 'group' : isBroadcast ? 'broadcast' : 'private'} message from ${sender}`);

                // Delegate all command dispatch to handler.js
                // (handles prefix check, permissions, group admin, run() API)
                if (config.READ_MESSAGE) {
                    try { await sock.readMessages([m.key]); } catch (e) { /* ignore */ }
                }
                await handleMessages(sock, m);
            }
        } catch (err) {
            logMessage('ERROR', `messages.upsert consolidated handler error: ${err.stack || err.message}`);
        }
    });

    return sock;
}

// ✅ Express Web API
const app = express();
app.use(express.static(path.join(__dirname, 'smm')));
app.get('/', (req, res) => {
    const html = path.join(__dirname, 'smm', 'silva.html');
    if (fs.existsSync(html)) return res.sendFile(html);
    res.send(`<h2>✅ ${config.BOT_NAME} is Running!</h2>`);
});
app.get('/health', (req, res) => res.json({ status: 'ok', bot: config.BOT_NAME, time: new Date().toISOString() }));
app.get('/ping', (req, res) => res.send('pong'));

app.listen(port, () => {
    logMessage('INFO', `🌐 Server running on port ${port}`);
    logMessage('INFO', `📊 Dashboard available at http://localhost:${port}`);

    // ── Heroku keep-alive self-ping ─────────────────────────────────────────
    // On Heroku free/eco dynos the process sleeps after 30 min of no traffic,
    // killing the WhatsApp socket. Pinging our own /ping endpoint every 25 min
    // keeps the dyno awake without needing an external service.
    // Set APP_URL=https://your-app.herokuapp.com in Heroku config vars.
    const keepAliveUrl = process.env.APP_URL || process.env.HEROKU_APP_DEFAULT_DOMAIN_NAME
        ? `https://${process.env.HEROKU_APP_DEFAULT_DOMAIN_NAME}/ping`
        : null;

    if (keepAliveUrl || process.env.APP_URL) {
        const pingUrl = process.env.APP_URL
            ? `${process.env.APP_URL.replace(/\/$/, '')}/ping`
            : keepAliveUrl;
        const https = require('https');
        const http  = require('http');
        const pinger = pingUrl.startsWith('https') ? https : http;

        setInterval(() => {
            try {
                pinger.get(pingUrl, (res) => {
                    logMessage('DEBUG', `[KeepAlive] pinged ${pingUrl} → ${res.statusCode}`);
                }).on('error', (e) => {
                    logMessage('WARN', `[KeepAlive] ping failed: ${e.message}`);
                });
            } catch (e) { /* ignore */ }
        }, 25 * 60 * 1000); // every 25 minutes

        logMessage('INFO', `🔄 Heroku keep-alive enabled → ${pingUrl}`);
    }
});

// ✅ Error handling
process.on('uncaughtException', (err) => {
    try {
        logMessage('CRITICAL', `Uncaught Exception: ${err.stack || err.message}`);
    } catch (_) {}
    setTimeout(() => {
        connectToWhatsApp().catch(e => {
            try { logMessage('CRITICAL', `Reconnect failed: ${e.message}`); } catch (_) {}
        });
    }, 5000);
});
process.on('unhandledRejection', (reason, promise) => {
    try {
        logMessage('WARN', `Unhandled Rejection: ${reason}`);
    } catch (_) {}
});

// ✅ Boot Bot
(async () => {
    try {
        console.log('\x1b[36m');
        console.log('╔══════════════════════════════════════════╗');
        console.log('║  ____  _ _                 __  __ ____   ║');
        console.log('║ / ___|| (_)_   ____ _     |  \\/  |  _ \\  ║');
        console.log('║ \\___ \\| | \\ \\ / / _` |    | |\\/| | | | | ║');
        console.log('║  ___) | | |\\ V / (_| |    | |  | | |_| | ║');
        console.log('║ |____/|_|_| \\_/ \\__,_|    |_|  |_|____/  ║');
        console.log('║                                            ║');
        console.log('║        WhatsApp Bot  •  Node.js           ║');
        console.log('║     github.com/SilvaMD  •  v2.0           ║');
        console.log('╚══════════════════════════════════════════╝');
        console.log('\x1b[0m');
        logMessage('INFO', 'Booting Silva MD Bot...');

        // ── Load sudo users from disk ───────────────────────────────────────
        try {
            const sudoPath = require('path').join(__dirname, 'data', 'sudo.json');
            if (require('fs').existsSync(sudoPath)) {
                const sudoList = JSON.parse(require('fs').readFileSync(sudoPath, 'utf8'));
                global.sudoUsers = new Set(Array.isArray(sudoList) ? sudoList : []);
                logMessage('INFO', `Loaded ${global.sudoUsers.size} sudo user(s)`);
            } else {
                global.sudoUsers = new Set();
            }
        } catch (e) {
            global.sudoUsers = new Set();
            logMessage('WARN', `Could not load sudo list: ${e.message}`);
        }

        // loadSession is called ONCE here at startup.
        // connectToWhatsApp() and all reconnects reuse the saved state on disk.
        await loadSession();
        await connectToWhatsApp();
    } catch (e) {
        logMessage('CRITICAL', `Bot Init Failed: ${e.stack || e.message}`);
        setTimeout(() => connectToWhatsApp(), 5000);
    }
})();

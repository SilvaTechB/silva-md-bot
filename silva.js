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
    downloadContentFromMessage
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
        if (config.SESSION_ID && typeof config.SESSION_ID === 'string' && config.SESSION_ID.trim() !== '') {
            // SESSION_ID is provided — decode and restore it, replacing any existing creds
            if (fs.existsSync(credsPath)) {
                fs.unlinkSync(credsPath);
                logMessage('INFO', "♻️ ᴏʟᴅ ꜱᴇꜱꜱɪᴏɴ ʀᴇᴍᴏᴠᴇᴅ");
            }

            const [header, b64data] = config.SESSION_ID.split('~');
            if (header !== "Silva" || !b64data) {
                throw new Error("❌ Invalid session format. Expected 'Silva~.....'");
            }

            const cleanB64 = b64data.replace('...', '');
            const compressedData = Buffer.from(cleanB64, 'base64');
            const decompressedData = zlib.gunzipSync(compressedData);
            fs.writeFileSync(credsPath, decompressedData, "utf8");
            logMessage('SUCCESS', "✅ ɴᴇᴡ ꜱᴇꜱꜱɪᴏɴ ʟᴏᴀᴅᴇᴅ ꜱᴜᴄᴄᴇꜱꜱꜰᴜʟʟʏ");

        } else if (fs.existsSync(credsPath)) {
            // No SESSION_ID — reuse the session already on disk (Replit / local mode)
            logMessage('INFO', "📂 Using existing session from disk");

        } else {
            throw new Error("❌ SESSION_ID is missing or invalid");
        }

    } catch (e) {
        logMessage('ERROR', `Session Error: ${e.message}`);
        throw e;
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
        { name: 'ANTI_LINK', value: config.ANTI_LINK },
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
        await sock.sendMessage(ownerJid, { text: welcomeMsg, contextInfo: globalContextInfo });
        logMessage('SUCCESS', 'Welcome message sent to owner.');
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
        getMessage: async () => undefined,
        ...cryptoOptions
    });

    // bind the store so store.loadMessage works
    try {
        store.bind(sock.ev);
    } catch (e) {
        logMessage('WARN', `store.bind failed: ${e.message}`);
    }

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

            // Store bot JID and set owner number to the connected number
            global.botJid = sock.user.id;
            const rawNum = sock.user.id.includes(':')
                ? sock.user.id.split(':')[0]
                : sock.user.id.split('@')[0];
            config.OWNER_NUMBER = rawNum;
            logMessage('INFO', `Owner number set to: ${rawNum}`);

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
        
        // Clean old cache entries (older than 1 hour)
        const now = Date.now();
        for (const [key, value] of messageCache.entries()) {
            if (now - value.timestamp > 60 * 60 * 1000) { // 1 hour
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

    // Anti-delete handler (messages.delete - existing)
    sock.ev.on('messages.delete', async (item) => {
        try {
            logMessage('DEBUG', 'messages.delete triggered');
            const keys = Array.isArray(item) ? item.map(i => i.key) : (item?.keys || []);
            for (const key of keys) {
                const from = key.remoteJid;
                const isGroup = from?.endsWith?.('@g.us');
                if ((isGroup && !config.ANTIDELETE_GROUP) || (!isGroup && !config.ANTIDELETE_PRIVATE)) {
                    logMessage('DEBUG', `Anti-delete disabled for ${isGroup ? 'group' : 'private'}`);
                    continue;
                }

                const deletedMsg = await store.loadMessage(from, key.id);
                if (!deletedMsg) {
                    logMessage('WARN', `No stored message found for ${key.id}`);
                    continue;
                }

                const ownerJid = `${config.OWNER_NUMBER}@s.whatsapp.net`;
                const sender = key.participant || from;
                const senderName = (sender || '').split('@')[0];
                const msg = deletedMsg.message;
                const msgType = Object.keys(msg)[0];

                const caption = `🗑️ *Anti-Delete Alert!*\n\n👤 *Sender:* @${senderName}\n📌 *Chat:* ${isGroup ? 'Group' : 'Private'}\n\n💬 *Restored Message:*`;
                const opts = { contextInfo: { mentionedJid: [sender] } };
                const targetJid = ownerJid;

                switch (msgType) {
                    case 'conversation':
                        await sock.sendMessage(targetJid, { text: `${caption}\n\n${msg.conversation}`, ...opts });
                        break;
                    case 'extendedTextMessage':
                        await sock.sendMessage(targetJid, { text: `${caption}\n\n${msg.extendedTextMessage.text}`, ...opts });
                        break;
                    case 'imageMessage': {
                        const buffer = await downloadAsBuffer(msg.imageMessage, 'image');
                        if (buffer) await sock.sendMessage(targetJid, { image: buffer, caption: `${caption}\n\n${msg.imageMessage.caption || ''}`, ...opts });
                        break;
                    }
                    case 'videoMessage': {
                        const buffer = await downloadAsBuffer(msg.videoMessage, 'video');
                        if (buffer) await sock.sendMessage(targetJid, { video: buffer, caption: `${caption}\n\n${msg.videoMessage.caption || ''}`, ...opts });
                        break;
                    }
                    case 'documentMessage': {
                        const buffer = await downloadAsBuffer(msg.documentMessage, 'document');
                        if (buffer) await sock.sendMessage(targetJid, {
                            document: buffer,
                            mimetype: msg.documentMessage.mimetype,
                            fileName: msg.documentMessage.fileName || 'Restored-File',
                            caption,
                            ...opts
                        });
                        break;
                    }
                    default:
                        await sock.sendMessage(targetJid, { text: `${caption}\n\n[Unsupported Message Type: ${msgType}]`, ...opts });
                        break;
                }

                logMessage('SUCCESS', `Restored deleted message from ${senderName}`);
            }
        } catch (err) {
            logMessage('ERROR', `Anti-Delete Error: ${err.stack || err.message}`);
        }
    });

    // ✅ Anti-Demote: kick anyone who demotes a group admin
    sock.ev.on('group-participants.update', async ({ id, participants, action }) => {
        try {
            if (action !== 'demote') return;
            if (!global.antiDemoteGroups?.has(id)) return;

            // Re-promote the demoted admin and remove the demoter is tricky — instead we kick the demoter
            // The demoter is NOT in `participants` (those are the ones being demoted)
            // We just re-promote the demoted admins and notify
            logMessage('INFO', `Anti-Demote triggered in ${id}: re-promoting ${participants.join(', ')}`);
            await sock.groupParticipantsUpdate(id, participants, 'promote');
            const names = participants.map(p => `@${p.split('@')[0]}`).join(', ');
            await sock.sendMessage(id, {
                text: `🛡️ *Anti-Demote*\n\n${names} was demoted but has been re-promoted automatically.`,
                mentions: participants
            });
        } catch (err) {
            logMessage('WARN', `Anti-Demote error: ${err.message}`);
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
                // ---- STATUS handling (status@broadcast) — runs regardless of upsert type
                if (m.key.remoteJid === 'status@broadcast') {
                    try {
                        const statusId = m.key.id;

                        // Skip the bot's own status updates
                        if (m.key.fromMe) continue;

                        // Try every known participant field location across Baileys versions
                        const rawUserJid = m.participant
                            || m.key?.participant
                            || m.message?.participant
                            || null;

                        // Skip old statuses delivered at startup (first 25 s)
                        if (process.uptime() < 25) continue;
                        if (!rawUserJid) {
                            logMessage('WARN', `Status skipped — no participant for ${statusId}`);
                            continue;
                        }

                        // Always use the clean bare JID (strip device suffix)
                        const userJid = jidNormalizedUser(rawUserJid);

                        logMessage('EVENT', `Status from ${userJid}: ${statusId}`);

                        const { inner, msgType } = unwrapStatus(m);

                        if (config.AUTO_STATUS_SEEN) {
                            try {
                                // Use sendReceipts with explicit 'read' type so the poster
                                // always sees the view — readMessages() silently downgrades
                                // to 'read-self' when the account has read-receipts disabled,
                                // which means the poster never gets notified.
                                await sock.sendReceipts([{
                                    remoteJid:   'status@broadcast',
                                    id:           statusId,
                                    participant:  userJid,
                                    fromMe:       false
                                }], 'read');
                                logMessage('INFO', `Status seen: ${statusId}`);
                            } catch (e) {
                                logMessage('WARN', `Status seen failed: ${e.message}`);
                            }
                        }

                        if (config.AUTO_STATUS_REACT) {
                            try {
                                const emojis = (config.CUSTOM_REACT_EMOJIS || '❤️,🔥,💯,😍,👏').split(',');
                                const emoji  = emojis[Math.floor(Math.random() * emojis.length)].trim();
                                // statusJidList MUST contain only the poster's clean JID so the
                                // WhatsApp server routes the reaction receipt back to them with
                                // the correct emoji visible on their end.
                                await sock.sendMessage(
                                    'status@broadcast',
                                    {
                                        react: {
                                            text: emoji,
                                            key:  {
                                                remoteJid:   'status@broadcast',
                                                id:          statusId,
                                                participant: userJid,
                                                fromMe:      false
                                            }
                                        }
                                    },
                                    { statusJidList: [userJid] }
                                );
                                logMessage('INFO', `Status reacted ${emoji} → ${statusId}`);
                            } catch (e) {
                                logMessage('WARN', `Status react failed: ${e.message}`);
                            }
                        }

                        if (config.AUTO_STATUS_REPLY) {
                            try {
                                await sock.sendMessage(userJid, {
                                    text: config.AUTO_STATUS_MSG,
                                    contextInfo: {
                                        stanzaId: statusId,
                                        participant: userJid,
                                        quotedMessage: inner
                                    }
                                });
                                logMessage('INFO', `Status replied: ${statusId}`);
                            } catch (e) {
                                logMessage('WARN', `Status reply failed: ${e.message}`);
                            }
                        }

                        if (config.Status_Saver === 'true') {
                            try {
                                const userName = await sock.getName(userJid) || 'Unknown';
                                const statusHeader = 'AUTO STATUS SAVER';
                                let caption = `${statusHeader}\n\n*🩵 Status From:* ${userName}`;

                                switch (msgType) {
                                    case 'imageMessage':
                                    case 'videoMessage':
                                        if (inner[msgType]?.caption) caption += `\n*🩵 Caption:* ${inner[msgType].caption}`;
                                        await saveMedia({ message: inner }, msgType, sock, caption);
                                        break;
                                    case 'audioMessage':
                                        caption += `\n*🩵 Audio Status*`;
                                        await saveMedia({ message: inner }, msgType, sock, caption);
                                        break;
                                    case 'extendedTextMessage':
                                        caption = `${statusHeader}\n\n${inner.extendedTextMessage?.text || ''}`;
                                        await sock.sendMessage(`${config.OWNER_NUMBER.replace(/\D/g, '')}@s.whatsapp.net`, { text: caption });
                                        break;
                                    default:
                                        logMessage('WARN', `Unsupported status type: ${msgType}`);
                                        break;
                                }

                                if (config.STATUS_REPLY === 'true') {
                                    const replyMsg = config.STATUS_MSG || 'SILVA MD 💖 SUCCESSFULLY VIEWED YOUR STATUS';
                                    await sock.sendMessage(userJid, { text: replyMsg });
                                }
                                logMessage('INFO', `Status saved: ${statusId}`);
                            } catch (e) {
                                logMessage('ERROR', `Status save failed: ${e.message}`);
                            }
                        }
                    } catch (e) {
                        logMessage('ERROR', `Status handler error: ${e.message}`);
                    }

                    // continue to next message in the upsert array
                    continue;
                }

                // For non-status messages only process notify/append upsert types
                if (type && !['notify', 'append'].includes(type)) continue;

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
                        if (config.AUTO_FOLLOW_NEWSLETTER) {
                            if (!global._followedNewsletters) global._followedNewsletters = new Set();
                            if (!global._followedNewsletters.has(nlJid)) {
                                try {
                                    await sock.newsletterFollow(nlJid);
                                    global._followedNewsletters.add(nlJid);
                                    logMessage('INFO', `✅ Auto-followed newsletter: ${nlJid}`);
                                } catch (e) {
                                    logMessage('WARN', `Newsletter follow failed (${nlJid}): ${e.message} | stack: ${e.stack}`);
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
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'smm', 'silva.html')));
app.get('/health', (req, res) => res.send(`✅ ${config.BOT_NAME} is Running!`));

app.listen(port, () => {
    logMessage('INFO', `🌐 Server running on port ${port}`);
    logMessage('INFO', `📊 Dashboard available at http://localhost:${port}`);
});

// ✅ Error handling
process.on('uncaughtException', (err) => {
    logMessage('CRITICAL', `Uncaught Exception: ${err.stack || err.message}`);
    setTimeout(() => connectToWhatsApp(), 5000);
});
process.on('unhandledRejection', (reason, promise) => {
    logMessage('CRITICAL', `Unhandled Rejection: ${reason} at ${promise}`);
});

// ✅ Boot Bot
(async () => {
    try {
        logMessage('INFO', 'Booting Silva MD Bot...');
        // loadSession is called ONCE here at startup.
        // connectToWhatsApp() and all reconnects reuse the saved state on disk.
        await loadSession();
        await connectToWhatsApp();
    } catch (e) {
        logMessage('CRITICAL', `Bot Init Failed: ${e.stack || e.message}`);
        setTimeout(() => connectToWhatsApp(), 5000);
    }
})();

'use strict';

/**
 * lib/statusManager.js
 * Centralised handler for status@broadcast messages.
 * Covers: auto-view, auto-like (react), auto-reply, status-saver.
 *
 * Usage in silva.js:
 *   const { handleStatusBroadcast } = require('./lib/statusManager');
 *   // inside messages.upsert loop:
 *   if (m.key.remoteJid === 'status@broadcast') {
 *       await handleStatusBroadcast(sock, m);
 *       continue;
 *   }
 */

const config = require('../config');

// ─── Settings resolver ────────────────────────────────────────────────────────
/**
 * Merges runtime flag overrides (set by autostatus.js plugin) with
 * the static values from config.env so callers always get one object.
 */
function getAutoStatusSettings() {
    const flags = global.autoStatusFlags || {};
    return {
        autoviewStatus: flags.seen  !== null && flags.seen  !== undefined
            ? String(flags.seen)
            : String(config.AUTO_STATUS_SEEN),

        autoLikeStatus: flags.react !== null && flags.react !== undefined
            ? String(flags.react)
            : String(config.AUTO_STATUS_REACT),

        autoReplyStatus:   String(config.AUTO_STATUS_REPLY),
        statusReplyText:   config.AUTO_STATUS_MSG   || 'Seen by Silva MD 💖',
        statusLikeEmojis:  config.CUSTOM_REACT_EMOJIS || '❤️,🔥,💯,😍,👏',
        statusSaver:       String(config.Status_Saver  || 'false'),
        statusSaverReply:  String(config.STATUS_REPLY  || 'false'),
        statusSaverMsg:    config.STATUS_MSG || 'SILVA MD 💖 SUCCESSFULLY VIEWED YOUR STATUS',
    };
}

// ─── Message-type unwrapper ───────────────────────────────────────────────────
/**
 * Peels off the outer wrapper layers (ephemeral, viewOnce, etc.) and
 * returns { inner, msgType } where inner is the innermost message object
 * and msgType is the first key that holds media/text content.
 */
function unwrapStatus(m) {
    let msg = m.message || {};

    // Peel ephemeral wrapper
    if (msg.ephemeralMessage) msg = msg.ephemeralMessage.message || msg;

    // Peel viewOnce wrapper
    const voKey = Object.keys(msg).find(k => k.startsWith('viewOnce'));
    if (voKey) msg = msg[voKey].message || msg;

    const ORDER = [
        'imageMessage', 'videoMessage', 'audioMessage',
        'extendedTextMessage', 'conversation', 'stickerMessage',
        'documentMessage', 'reactionMessage'
    ];
    const msgType = ORDER.find(k => msg[k]) || Object.keys(msg)[0] || 'unknown';
    return { inner: msg, msgType };
}

// ─── Main handler ─────────────────────────────────────────────────────────────
/**
 * @param {object} sock   - Baileys socket instance
 * @param {object} m      - raw message object from messages.upsert
 * @param {Function} [saveMedia] - optional media-save helper (silva.js saveMedia)
 */
async function handleStatusBroadcast(sock, m, saveMedia) {
    try {
        const settings    = getAutoStatusSettings();
        const statusId    = m.key.id;
        const userJid     = m.key.participant;

        // Skip own status echoes (participant is null when it's our own post)
        if (!userJid) return;

        // Unwrap ephemeral wrapper on the message object itself (mutates m)
        if (m.message?.ephemeralMessage) {
            m.message = m.message.ephemeralMessage.message;
        }

        const { inner, msgType } = unwrapStatus(m);

        // ── 1. Auto View ─────────────────────────────────────────────────────
        if (settings.autoviewStatus === 'true') {
            try {
                await sock.readMessages([m.key]);
                console.log(`[StatusManager] ✅ Status viewed: ${statusId}`);
            } catch (e) {
                console.warn(`[StatusManager] ⚠️ View failed: ${e.message}`);
            }
        }

        // ── 2. Auto Like / React ─────────────────────────────────────────────
        if (settings.autoLikeStatus === 'true' && userJid) {
            try {
                const emojis      = settings.statusLikeEmojis.split(',').map(e => e.trim()).filter(Boolean);
                const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)] || '❤️';

                await sock.sendMessage(
                    'status@broadcast',
                    {
                        react: {
                            key: {
                                remoteJid:   'status@broadcast',
                                fromMe:      false,
                                id:          statusId,
                                participant: userJid
                            },
                            text: randomEmoji
                        }
                    }
                );
                console.log(`[StatusManager] ✅ Liked status ${statusId} with ${randomEmoji}`);
            } catch (e) {
                console.warn(`[StatusManager] ⚠️ Like failed: ${e.message}`);
            }
        }

        // ── 3. Auto Reply ────────────────────────────────────────────────────
        if (settings.autoReplyStatus === 'true' && !m.key.fromMe) {
            try {
                const senderJid = userJid || m.key.remoteJid;
                await sock.sendMessage(
                    senderJid,
                    { text: settings.statusReplyText },
                    { quoted: m }
                );
                console.log(`[StatusManager] ✅ Replied to status: ${statusId}`);
            } catch (e) {
                console.warn(`[StatusManager] ⚠️ Reply failed: ${e.message}`);
            }
        }

        // ── 4. Status Saver ──────────────────────────────────────────────────
        if (settings.statusSaver === 'true' && typeof saveMedia === 'function') {
            try {
                const userName   = await sock.getName?.(userJid) || userJid.split('@')[0];
                const header     = 'AUTO STATUS SAVER';
                let   caption    = `${header}\n\n*🩵 Status From:* ${userName}`;

                switch (msgType) {
                    case 'imageMessage':
                    case 'videoMessage':
                        if (inner[msgType]?.caption) caption += `\n*🩵 Caption:* ${inner[msgType].caption}`;
                        await saveMedia({ message: inner }, msgType, sock, caption);
                        break;
                    case 'audioMessage':
                        caption += '\n*🩵 Audio Status*';
                        await saveMedia({ message: inner }, msgType, sock, caption);
                        break;
                    case 'extendedTextMessage':
                        caption = `${header}\n\n${inner.extendedTextMessage?.text || ''}`;
                        await sock.sendMessage(sock.user.id, { text: caption });
                        break;
                    default:
                        console.warn(`[StatusManager] Unsupported status type: ${msgType}`);
                        break;
                }

                if (settings.statusSaverReply === 'true') {
                    await sock.sendMessage(userJid, { text: settings.statusSaverMsg });
                }
                console.log(`[StatusManager] ✅ Status saved: ${statusId}`);
            } catch (e) {
                console.error(`[StatusManager] ❌ Save failed: ${e.message}`);
            }
        }
    } catch (e) {
        console.error(`[StatusManager] ❌ Handler error: ${e.message}`);
    }
}

module.exports = { handleStatusBroadcast, getAutoStatusSettings, unwrapStatus };

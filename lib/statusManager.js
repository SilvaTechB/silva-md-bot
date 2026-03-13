'use strict';

/**
 * lib/statusManager.js
 * Centralised handler for status@broadcast messages.
 *
 * Usage in silva.js messages.upsert loop:
 *   const { handleStatusBroadcast } = require('./lib/statusManager');
 *   if (m.key.remoteJid === 'status@broadcast') {
 *       await handleStatusBroadcast(sock, m, saveMedia);
 *       continue;
 *   }
 */

const config = require('../config');

// ─── Settings resolver ────────────────────────────────────────────────────────
// Merges runtime flag overrides (.autoview/.autolike commands in autostatus.js)
// with the static values from config.env.
function getAutoStatusSettings() {
    const flags = global.autoStatusFlags || {};

    const resolve = (runtimeVal, configVal) => {
        // runtime override wins when explicitly set to true/false
        if (runtimeVal !== null && runtimeVal !== undefined) return String(runtimeVal);
        // fall back to config value
        if (configVal !== null && configVal !== undefined) return String(configVal);
        return 'false';
    };

    return {
        autoviewStatus:  resolve(flags.seen,  config.AUTO_STATUS_SEEN),
        autoLikeStatus:  resolve(flags.react, config.AUTO_STATUS_REACT),
        autoReplyStatus: resolve(null,         config.AUTO_STATUS_REPLY),
        statusReplyText: config.AUTO_STATUS_MSG || 'Seen by Silva MD 💖',
        statusLikeEmojis: config.CUSTOM_REACT_EMOJIS || '❤️,🔥,💯,😍,👏',
        statusSaver:     String(config.Status_Saver || 'false'),
        statusSaverReply: String(config.STATUS_REPLY || 'false'),
        statusSaverMsg:  config.STATUS_MSG || 'SILVA MD 💖 SUCCESSFULLY VIEWED YOUR STATUS',
    };
}

// ─── Message-type unwrapper ───────────────────────────────────────────────────
function unwrapStatus(m) {
    let msg = m.message || {};

    // peel ephemeral wrapper (mutate m so downstream also sees unwrapped content)
    if (msg.ephemeralMessage) {
        msg = msg.ephemeralMessage.message || msg;
        m.message = msg;
    }

    const ORDER = [
        'imageMessage', 'videoMessage', 'audioMessage',
        'extendedTextMessage', 'conversation', 'stickerMessage',
        'documentMessage', 'reactionMessage',
    ];
    const msgType = ORDER.find(k => msg[k]) || Object.keys(msg)[0] || 'unknown';
    return { inner: msg, msgType };
}

// ─── Main handler ─────────────────────────────────────────────────────────────
async function handleStatusBroadcast(sock, m, saveMedia) {
    try {
        const settings = getAutoStatusSettings();
        const statusId = m.key.id;
        const userJid  = m.key.participant;   // null when it's our own post

        // skip our own status echo
        if (!userJid) return;

        // unwrap ephemeral / viewOnce wrappers
        const { inner, msgType } = unwrapStatus(m);

        console.log(`[StatusManager] 📨 Status from ${userJid} | type: ${msgType}`);
        console.log(`[StatusManager] ⚙️  view:${settings.autoviewStatus} | like:${settings.autoLikeStatus} | reply:${settings.autoReplyStatus}`);

        // ── 1. Auto View ─────────────────────────────────────────────────────
        if (settings.autoviewStatus === 'true') {
            try {
                // Use m.key directly — Baileys already has all required fields set
                await sock.readMessages([m.key]);
                console.log(`[StatusManager] ✅ Status viewed: ${statusId}`);
            } catch (e) {
                console.warn(`[StatusManager] ⚠️ View failed: ${e.message}`);
            }
        }

        // ── 2. Auto Like / React ─────────────────────────────────────────────
        if (settings.autoLikeStatus === 'true' && userJid) {
            try {
                const emojis = settings.statusLikeEmojis
                    .split(',').map(e => e.trim()).filter(Boolean);
                const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)] || '❤️';

                // Explicitly build the key exactly as WhatsApp expects for status reactions
                await sock.sendMessage(
                    'status@broadcast',
                    {
                        react: {
                            key: {
                                remoteJid:   'status@broadcast',
                                fromMe:      false,
                                id:          statusId,
                                participant: userJid,
                            },
                            text: randomEmoji,
                        },
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
                const userName = await sock.getName?.(userJid) || userJid.split('@')[0];
                const header   = 'AUTO STATUS SAVER';
                let caption    = `${header}\n\n*🩵 Status From:* ${userName}`;

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
                        console.warn(`[StatusManager] ⚠️ Unsupported status type for saver: ${msgType}`);
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

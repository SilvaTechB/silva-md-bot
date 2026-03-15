'use strict';

/**
 * lib/statusManager.js
 * Centralised handler for status@broadcast messages.
 */

const config = require('../config');

// ─── Settings resolver ────────────────────────────────────────────────────────
function getAutoStatusSettings() {
    const flags = global.autoStatusFlags || {};

    const resolve = (runtimeVal, configVal) => {
        if (runtimeVal !== null && runtimeVal !== undefined) return String(runtimeVal);
        if (configVal  !== null && configVal  !== undefined) return String(configVal);
        return 'false';
    };

    return {
        autoviewStatus:   resolve(flags.seen,  config.AUTO_STATUS_SEEN),
        autoLikeStatus:   resolve(flags.react, config.AUTO_STATUS_REACT),
        autoReplyStatus:  resolve(null, config.AUTO_STATUS_REPLY),
        statusReplyText:  config.AUTO_STATUS_MSG || 'Seen by Silva MD 💖',
        statusLikeEmojis: config.CUSTOM_REACT_EMOJIS || '❤️,🔥,💯,😍,👏',
        statusSaver:      String(config.Status_Saver  || 'false'),
        statusSaverReply: String(config.STATUS_REPLY  || 'false'),
        statusSaverMsg:   config.STATUS_MSG || 'SILVA MD 💖 SUCCESSFULLY VIEWED YOUR STATUS',
    };
}

// ─── Message-type unwrapper ───────────────────────────────────────────────────
function unwrapStatus(m) {
    let msg = m.message || {};
    if (msg.ephemeralMessage) {
        msg = msg.ephemeralMessage.message || msg;
        m.message = msg;
    }
    const voKey = Object.keys(msg).find(k => k.startsWith('viewOnce'));
    if (voKey) msg = msg[voKey].message || msg;

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
        const settings    = getAutoStatusSettings();
        const statusId    = m.key.id;
        const participant = m.key.participant;   // sender of the status (may be @lid)

        if (!participant) return;   // skip own status echoes (no participant = from self)

        const { inner, msgType } = unwrapStatus(m);

        console.log(`[StatusManager] 📨 Status | from:${participant} | type:${msgType}`);
        console.log(`[StatusManager] ⚙️  view:${settings.autoviewStatus} | like:${settings.autoLikeStatus} | reply:${settings.autoReplyStatus}`);

        // ── 1. Auto View (read receipt) ─────────────────────────────────────
        if (settings.autoviewStatus === 'true') {
            try {
                await sock.readMessages([m.key]);
                console.log(`[StatusManager] ✅ Status viewed: ${statusId}`);
            } catch (viewErr) {
                console.warn(`[StatusManager] ⚠️ View failed: ${viewErr.message}`);
            }
        }

        // ── 2. Auto Like / React ─────────────────────────────────────────────
        if (settings.autoLikeStatus === 'true') {
            const emojis = settings.statusLikeEmojis
                .split(',').map(e => e.trim()).filter(Boolean);
            const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)] || '❤️';

            try {
                await sock.sendMessage(
                    'status@broadcast',
                    {
                        react: {
                            key: {
                                remoteJid:   'status@broadcast',
                                fromMe:      false,
                                id:          statusId,
                                participant: participant,
                            },
                            text: randomEmoji,
                        },
                    }
                );
                console.log(`[StatusManager] ✅ Liked status ${statusId} with ${randomEmoji}`);
            } catch (likeErr) {
                console.warn(`[StatusManager] ⚠️ Like failed: ${likeErr.message}`);
            }
        }

        // ── 3. Auto Reply ────────────────────────────────────────────────────
        if (settings.autoReplyStatus === 'true' && !m.key.fromMe) {
            const senderJid = participant || m.key.remoteJid;
            try {
                await sock.sendMessage(
                    senderJid,
                    { text: settings.statusReplyText },
                    { quoted: m }
                );
                console.log(`[StatusManager] ✅ Replied to ${statusId}`);
            } catch (replyErr) {
                console.warn(`[StatusManager] ⚠️ Reply failed: ${replyErr.message}`);
            }
        }

        // ── 4. Status Saver ──────────────────────────────────────────────────
        if (settings.statusSaver === 'true' && typeof saveMedia === 'function') {
            try {
                const displayJid = participant;
                const userName   = await sock.getName?.(displayJid) || displayJid.split('@')[0];
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
                        break;
                }

                if (settings.statusSaverReply === 'true') {
                    await sock.sendMessage(displayJid, { text: settings.statusSaverMsg });
                }
                console.log(`[StatusManager] ✅ Status saved: ${statusId}`);
            } catch (saveErr) {
                console.error(`[StatusManager] ❌ Save failed: ${saveErr.message}`);
            }
        }

    } catch (e) {
        console.error(`[StatusManager] ❌ Handler error: ${e.message}`);
    }
}

module.exports = { handleStatusBroadcast, getAutoStatusSettings, unwrapStatus };

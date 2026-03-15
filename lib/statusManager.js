'use strict';

/**
 * lib/statusManager.js
 * Centralised handler for status@broadcast messages.
 * Built for gifted-baileys (npm:gifted-baileys@^2.5.8)
 *
 * Key API differences vs standard @whiskeysockets/baileys:
 *  - Read receipts  → sock.sendReadReceipt(), NOT sock.readMessages()
 *  - React key      → must pass m.key as-is, not reconstructed
 *  - statusJidList  → required in sendMessage options for reactions
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
        statusReplyText:  config.AUTO_STATUS_MSG    || 'Seen by Silva MD 💖',
        statusLikeEmojis: config.CUSTOM_REACT_EMOJIS || '❤️,🔥,💯,😍,👏',
        statusSaver:      String(config.Status_Saver  || 'false'),
        statusSaverReply: String(config.STATUS_REPLY  || 'false'),
        statusSaverMsg:   config.STATUS_MSG || 'SILVA MD 💖 SUCCESSFULLY VIEWED YOUR STATUS',
    };
}

// ─── Message-type unwrapper ───────────────────────────────────────────────────
function unwrapStatus(m) {
    let msg = { ...(m.message || {}) };
    if (msg.ephemeralMessage) msg = { ...(msg.ephemeralMessage.message || msg) };
    const voKey = Object.keys(msg).find(k => k.startsWith('viewOnce'));
    if (voKey) msg = { ...(msg[voKey].message || msg) };

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
    // ── DIAGNOSTIC: always log every status arrival so you can confirm
    //    this function is actually being called. Remove once confirmed working.
    console.log('[StatusManager] ▶▶▶ handleStatusBroadcast called');
    console.log('[StatusManager]     key.id         =', m.key?.id);
    console.log('[StatusManager]     key.participant =', m.key?.participant);
    console.log('[StatusManager]     key.fromMe      =', m.key?.fromMe);
    console.log('[StatusManager]     message keys    =', Object.keys(m.message || {}));

    try {
        const settings    = getAutoStatusSettings();
        const statusId    = m.key.id;
        const participant = m.key.participant;

        console.log('[StatusManager] ⚙️  Settings →',
            'view:', settings.autoviewStatus,
            '| like:', settings.autoLikeStatus,
            '| reply:', settings.autoReplyStatus
        );

        // Own status echoes have no participant — skip them.
        if (!participant) {
            console.log('[StatusManager] ⏭️  Skipping own status (no participant)');
            return;
        }

        const { inner, msgType } = unwrapStatus(m);
        console.log(`[StatusManager] 📨 Status from:${participant} | type:${msgType} | id:${statusId}`);

        // ── 1. Auto View ─────────────────────────────────────────────────────
        if (settings.autoviewStatus === 'true') {
            try {
                // gifted-baileys: use sendReadReceipt(jid, sender, [msgId])
                // sock.readMessages() does NOT trigger status read receipts in this fork.
                await sock.sendReadReceipt(
                    'status@broadcast',
                    participant,
                    [statusId]
                );
                console.log(`[StatusManager] ✅ Status viewed (sendReadReceipt): ${statusId}`);
            } catch (viewErr) {
                console.warn(`[StatusManager] ⚠️ sendReadReceipt failed: ${viewErr.message}`);

                // Fallback: some gifted-baileys builds still expose readMessages
                try {
                    await sock.readMessages([{
                        remoteJid:   'status@broadcast',
                        id:          statusId,
                        participant: participant,
                        fromMe:      false,
                    }]);
                    console.log(`[StatusManager] ✅ Status viewed (readMessages fallback): ${statusId}`);
                } catch (fallbackErr) {
                    console.warn(`[StatusManager] ⚠️ readMessages fallback also failed: ${fallbackErr.message}`);
                }
            }
        } else {
            console.log('[StatusManager] ⏭️  Auto-view is OFF');
        }

        // ── 2. Auto Like / React ─────────────────────────────────────────────
        if (settings.autoLikeStatus === 'true') {
            const emojis      = settings.statusLikeEmojis.split(',').map(e => e.trim()).filter(Boolean);
            const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)] || '❤️';

            console.log(`[StatusManager] 🔄 Attempting like with emoji: ${randomEmoji}`);

            try {
                // gifted-baileys: pass m.key as-is (do NOT reconstruct the key).
                // Reconstructed keys are rejected silently by this fork.
                // statusJidList is still required in the options object.
                const botJid = sock.user?.id || global.botJid || '';

                await sock.sendMessage(
                    'status@broadcast',
                    {
                        react: {
                            key:  m.key,         // ← pass original key directly
                            text: randomEmoji,
                        },
                    },
                    {
                        // gifted-baileys requires statusJidList or the message is dropped.
                        statusJidList: [participant, botJid].filter(Boolean),
                    }
                );
                console.log(`[StatusManager] ✅ Liked status ${statusId} with ${randomEmoji}`);
            } catch (likeErr) {
                console.warn(`[StatusManager] ⚠️ Like failed: ${likeErr.message}`);
            }
        } else {
            console.log('[StatusManager] ⏭️  Auto-like is OFF');
        }

        // ── 3. Auto Reply ────────────────────────────────────────────────────
        if (settings.autoReplyStatus === 'true' && !m.key.fromMe) {
            try {
                await sock.sendMessage(
                    participant,
                    { text: settings.statusReplyText },
                    { quoted: m }
                );
                console.log(`[StatusManager] ✅ Replied to status: ${statusId}`);
            } catch (replyErr) {
                console.warn(`[StatusManager] ⚠️ Reply failed: ${replyErr.message}`);
            }
        }

        // ── 4. Status Saver ──────────────────────────────────────────────────
        if (settings.statusSaver === 'true' && typeof saveMedia === 'function') {
            try {
                const userName = await sock.getName?.(participant) || participant.split('@')[0];
                const header   = 'AUTO STATUS SAVER';
                let   caption  = `${header}\n\n*🩵 Status From:* ${userName}`;

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
                        console.warn(`[StatusManager] ℹ️ No saver handler for type: ${msgType}`);
                        break;
                }

                if (settings.statusSaverReply === 'true') {
                    await sock.sendMessage(participant, { text: settings.statusSaverMsg });
                }
                console.log(`[StatusManager] ✅ Status saved: ${statusId}`);
            } catch (saveErr) {
                console.error(`[StatusManager] ❌ Save failed: ${saveErr.message}`);
            }
        }

    } catch (e) {
        console.error(`[StatusManager] ❌ Handler error: ${e.stack || e.message}`);
    }
}

module.exports = { handleStatusBroadcast, getAutoStatusSettings, unwrapStatus };

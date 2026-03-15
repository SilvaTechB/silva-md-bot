'use strict';

/**
 * lib/statusManager.js
 * Status@broadcast handler for gifted-baileys (npm:gifted-baileys@^2.5.8)
 *
 * Gifted-baileys API differences vs standard @whiskeysockets/baileys:
 *  - Auto-view  → sock.sendReadReceipt('status@broadcast', sender, [msgId])
 *                 NOT sock.readMessages() — that API does not trigger read receipts here.
 *  - React key  → pass m.key AS-IS; do NOT reconstruct {remoteJid, id, participant}
 *                 Reconstructed keys are silently dropped by this fork.
 *  - statusJidList is required in sendMessage options for reactions.
 */

const config = require('../config');

// ─── Message-type unwrapper ────────────────────────────────────────────────────
function unwrapStatus(msg) {
    // Peel viewOnce / ephemeral wrappers
    let inner = { ...(msg.message || {}) };
    if (inner.ephemeralMessage)   inner = { ...(inner.ephemeralMessage.message   || inner) };
    if (inner.viewOnceMessageV2)  inner = { ...(inner.viewOnceMessageV2.message  || inner) };
    if (inner.viewOnceMessage)    inner = { ...(inner.viewOnceMessage.message     || inner) };

    const ORDER = [
        'imageMessage', 'videoMessage', 'audioMessage',
        'extendedTextMessage', 'conversation', 'stickerMessage',
        'documentMessage', 'reactionMessage',
    ];
    const msgType = ORDER.find(k => inner[k]) || Object.keys(inner)[0] || 'unknown';
    return { inner, msgType };
}

// ─── Main handler ──────────────────────────────────────────────────────────────
async function handleStatusBroadcast(sock, m, saveMedia) {
    try {
        const statusId = m.key.id;
        const userJid  = m.key.participant;

        // Own status echoes have no participant — skip them
        if (!userJid) return;

        const { inner, msgType } = unwrapStatus(m);

        // ── 1. Auto View (mark as seen) ────────────────────────────────────────
        if (config.AUTO_STATUS_SEEN) {
            try {
                // gifted-baileys: sendReadReceipt is the correct API for status read receipts
                await sock.sendReadReceipt('status@broadcast', userJid, [statusId]);
            } catch (e) {
                // Fallback: some builds still expose readMessages
                try {
                    await sock.readMessages([{
                        remoteJid:   'status@broadcast',
                        id:          statusId,
                        participant: userJid,
                        fromMe:      false,
                    }]);
                } catch { /* ignore — best effort */ }
            }
        }

        // ── 2. Auto React ──────────────────────────────────────────────────────
        if (config.AUTO_STATUS_REACT) {
            try {
                const emojis      = (config.CUSTOM_REACT_EMOJIS || '❤️,🔥,💯,😍,👏').split(',');
                const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)].trim();
                const botJid      = sock.user?.id || global.botJid || '';

                // gifted-baileys: pass m.key AS-IS (not a reconstructed key object)
                await sock.sendMessage(
                    'status@broadcast',
                    {
                        react: {
                            text: randomEmoji,
                            key:  m.key,
                        },
                    },
                    {
                        // statusJidList is required in gifted-baileys for the message to be sent
                        statusJidList: [userJid, botJid].filter(Boolean),
                    }
                );
            } catch (e) {
                console.warn(`[StatusManager] React failed: ${e.message}`);
            }
        }

        // ── 3. Auto Reply ──────────────────────────────────────────────────────
        if (config.AUTO_STATUS_REPLY && !m.key.fromMe) {
            try {
                await sock.sendMessage(
                    userJid,
                    {
                        text: config.AUTO_STATUS_MSG,
                        contextInfo: {
                            stanzaId:      statusId,
                            participant:   userJid,
                            quotedMessage: inner,
                        },
                    }
                );
            } catch (e) {
                console.warn(`[StatusManager] Reply failed: ${e.message}`);
            }
        }

        // ── 4. Status Saver ────────────────────────────────────────────────────
        if (config.Status_Saver === 'true' && typeof saveMedia === 'function') {
            try {
                const userName    = await sock.getName?.(userJid) || userJid.split('@')[0];
                const statusHeader = 'AUTO STATUS SAVER';
                let   caption     = `${statusHeader}\n\n*🩵 Status From:* ${userName}`;

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
                        await sock.sendMessage(sock.user.id, { text: caption });
                        break;
                    default:
                        console.warn(`[StatusManager] No saver handler for type: ${msgType}`);
                        break;
                }

                if (config.STATUS_REPLY === 'true') {
                    const replyMsg = config.STATUS_MSG || 'SILVA MD 💖 SUCCESSFULLY VIEWED YOUR STATUS';
                    await sock.sendMessage(userJid, { text: replyMsg });
                }
            } catch (e) {
                console.error(`[StatusManager] Status save failed: ${e.message}`);
            }
        }

    } catch (e) {
        console.error(`[StatusManager] Handler error: ${e.message}`);
    }
}

// ─── Runtime flag setter (used by owner commands to toggle features live) ──────
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
        statusReplyText:  config.AUTO_STATUS_MSG       || 'Seen by Silva MD 💖',
        statusLikeEmojis: config.CUSTOM_REACT_EMOJIS   || '❤️,🔥,💯,😍,👏',
        statusSaver:      String(config.Status_Saver   || 'false'),
        statusSaverReply: String(config.STATUS_REPLY   || 'false'),
        statusSaverMsg:   config.STATUS_MSG            || 'SILVA MD 💖 SUCCESSFULLY VIEWED YOUR STATUS',
    };
}

module.exports = { handleStatusBroadcast, getAutoStatusSettings, unwrapStatus };

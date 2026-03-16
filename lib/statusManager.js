'use strict';

/**
 * lib/statusManager.js
 * Status@broadcast handler for gifted-baileys (npm:gifted-baileys@^2.5.8)
 *
 * Root-cause fix (confirmed from Heroku logs):
 *   statusJidList must contain @s.whatsapp.net (phone) JIDs, NOT @lid JIDs.
 *   gifted-baileys exposes m.key.participantPn for exactly this purpose.
 *   Previous code used m.key.participant (@lid) → WhatsApp silently rejected it.
 */

const config = require('../config');

// ─── Per-process dedup set ─────────────────────────────────────────────────────
// Prevents triple-processing when Bad MAC errors cause the same status to be
// retransmitted 2-3 times within the same session (seen in Heroku logs).
const _seenIds = new Set();

// ─── Message-type unwrapper ────────────────────────────────────────────────────
function unwrapStatus(m) {
    let inner = { ...(m.message || {}) };
    if (inner.ephemeralMessage)  inner = { ...(inner.ephemeralMessage.message  || inner) };
    if (inner.viewOnceMessageV2) inner = { ...(inner.viewOnceMessageV2.message || inner) };
    if (inner.viewOnceMessage)   inner = { ...(inner.viewOnceMessage.message   || inner) };

    const ORDER = [
        'imageMessage', 'videoMessage', 'audioMessage',
        'extendedTextMessage', 'conversation', 'stickerMessage',
        'documentMessage', 'reactionMessage',
    ];
    const msgType = ORDER.find(k => inner[k]) || Object.keys(inner)[0] || 'unknown';
    return { inner, msgType };
}

// ─── Resolve the phone JID from a status key ──────────────────────────────────
// gifted-baileys puts the @s.whatsapp.net JID in key.participantPn when the
// sender is a LID-migrated account. Always prefer that over key.participant.
function resolvePhoneJid(key) {
    // participantPn is the phone JID gifted-baileys attaches alongside the LID
    if (key.participantPn && key.participantPn.includes('@s.whatsapp.net')) {
        return key.participantPn;
    }
    // If participant is already a phone JID use it directly
    if (key.participant && key.participant.includes('@s.whatsapp.net')) {
        return key.participant;
    }
    // participant is a @lid — try the global LID→phone map built from contacts events
    if (key.participant && key.participant.includes('@lid') && global.lidJidMap?.has(key.participant)) {
        return global.lidJidMap.get(key.participant);
    }
    // Last resort: return whatever we have (may still be @lid, but we tried)
    return key.participant || null;
}

// ─── Main handler ──────────────────────────────────────────────────────────────
async function handleStatusBroadcast(sock, m, saveMedia) {
    try {
        const statusId    = m.key.id;
        const participant = m.key.participant;   // may be @lid

        // Skip own status echoes (participant is null when it is our own post)
        if (!participant) return;

        // ── Dedup: skip if we already handled this status ID this session ───
        if (_seenIds.has(statusId)) {
            console.log(`[StatusMgr] ⏭️  Duplicate status skipped: ${statusId}`);
            return;
        }
        _seenIds.add(statusId);
        // Prevent unbounded growth — keep only the last 500 IDs
        if (_seenIds.size > 500) {
            const oldest = _seenIds.values().next().value;
            _seenIds.delete(oldest);
        }

        const { inner, msgType } = unwrapStatus(m);

        // THE fix: use the phone JID (participantPn) not the LID for all delivery
        const phoneJid = resolvePhoneJid(m.key);
        const botRaw   = sock.user?.id || global.botJid || '';
        const botPhone = botRaw.replace(/:\d+@/, '@');   // strip :device suffix → bare phone JID

        console.log(`[StatusMgr] >>> id=${statusId} lid=${participant} phoneJid=${phoneJid} type=${msgType}`);
        console.log(`[StatusMgr] ⚙️  view=${config.AUTO_STATUS_SEEN} react=${config.AUTO_STATUS_REACT} reply=${config.AUTO_STATUS_REPLY}`);

        // ── 1. Auto View ───────────────────────────────────────────────────────
        if (config.AUTO_STATUS_SEEN) {
            let viewDone = false;

            // sendReceipt is the correct gifted-baileys API for status read receipts
            try {
                await sock.sendReceipt('status@broadcast', participant, [statusId], 'read');
                console.log('[StatusMgr] ✅ VIEW OK via sendReceipt');
                viewDone = true;
            } catch (e1) {
                console.warn(`[StatusMgr] sendReceipt failed: ${e1.message}`);
            }

            // Fallback to readMessages if sendReceipt is not available
            if (!viewDone) {
                try {
                    await sock.readMessages([{
                        remoteJid:   'status@broadcast',
                        id:          statusId,
                        participant: participant,
                        fromMe:      false,
                    }]);
                    console.log('[StatusMgr] ✅ VIEW OK via readMessages');
                    viewDone = true;
                } catch (e2) {
                    console.warn(`[StatusMgr] readMessages failed: ${e2.message}`);
                }
            }

            if (!viewDone) console.error('[StatusMgr] ❌ VIEW FAILED — all methods exhausted');
        }

        // ── 2. Auto React ──────────────────────────────────────────────────────
        if (config.AUTO_STATUS_REACT) {
            const emojis      = (config.CUSTOM_REACT_EMOJIS || '❤️,🔥,💯,😍,👏').split(',');
            const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)].trim() || '❤️';

            // THE FIX: statusJidList must use @s.whatsapp.net JIDs, never @lid.
            // WhatsApp silently drops reactions when LID JIDs appear in this list.
            const statusJidList = [phoneJid, botPhone].filter(Boolean);

            console.log(`[StatusMgr] 🔄 REACT emoji=${randomEmoji} statusJidList=${JSON.stringify(statusJidList)}`);

            try {
                await sock.sendMessage(
                    'status@broadcast',
                    {
                        react: {
                            text: randomEmoji,
                            key:  m.key,      // pass original key as-is (gifted-baileys requirement)
                        },
                    },
                    { statusJidList }
                );
                console.log('[StatusMgr] ✅ REACT sent OK');
            } catch (e) {
                console.error(`[StatusMgr] ❌ REACT FAILED: ${e.message}`);
            }
        }

        // ── 3. Auto Reply ──────────────────────────────────────────────────────
        if (config.AUTO_STATUS_REPLY && !m.key.fromMe) {
            // Send reply to the phone JID, not the LID
            const replyTo = phoneJid || participant;
            try {
                await sock.sendMessage(
                    replyTo,
                    {
                        text: config.AUTO_STATUS_MSG || 'Seen by Silva MD 💖',
                        contextInfo: {
                            stanzaId:      statusId,
                            participant:   replyTo,
                            quotedMessage: inner,
                        },
                    }
                );
                console.log('[StatusMgr] ✅ REPLY sent OK');
            } catch (e) {
                console.warn(`[StatusMgr] ⚠️ REPLY failed: ${e.message}`);
            }
        }

        // ── 4. Status Saver ────────────────────────────────────────────────────
        if (config.Status_Saver === 'true' && typeof saveMedia === 'function') {
            try {
                const displayJid   = phoneJid || participant;
                const userName     = await sock.getName?.(displayJid) || displayJid.split('@')[0];
                const header       = 'AUTO STATUS SAVER';
                let   caption      = `${header}\n\n*🩵 Status From:* ${userName}`;

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
                        console.warn(`[StatusMgr] ℹ️ No saver handler for type: ${msgType}`);
                        break;
                }

                if (config.STATUS_REPLY === 'true') {
                    const replyMsg = config.STATUS_MSG || 'SILVA MD 💖 SUCCESSFULLY VIEWED YOUR STATUS';
                    await sock.sendMessage(phoneJid || participant, { text: replyMsg });
                }

                console.log(`[StatusMgr] ✅ Status saved: ${statusId}`);
            } catch (e) {
                console.error(`[StatusMgr] ❌ Save failed: ${e.message}`);
            }
        }

    } catch (e) {
        console.error(`[StatusMgr] ❌ Handler error: ${e.message}\n${e.stack}`);
    }
}

// ─── Runtime flag setter (used by autostatus.js plugin) ───────────────────────
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
        autoReplyStatus:  resolve(null,        config.AUTO_STATUS_REPLY),
        statusReplyText:  config.AUTO_STATUS_MSG      || 'Seen by Silva MD 💖',
        statusLikeEmojis: config.CUSTOM_REACT_EMOJIS  || '❤️,🔥,💯,😍,👏',
        statusSaver:      String(config.Status_Saver  || 'false'),
        statusSaverReply: String(config.STATUS_REPLY  || 'false'),
        statusSaverMsg:   config.STATUS_MSG           || 'SILVA MD 💖 SUCCESSFULLY VIEWED YOUR STATUS',
    };
}

module.exports = { handleStatusBroadcast, getAutoStatusSettings, unwrapStatus };

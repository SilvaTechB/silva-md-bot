'use strict';

/**
 * lib/statusManager.js
 * Centralised handler for status@broadcast messages.
 *
 * LID accounts: status participant JIDs arrive as XXXXXXX@lid.
 * We resolve them via global.lidJidMap where possible, but also send
 * receipts/reactions using the direct low-level API so WhatsApp actually
 * registers the view and like.
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

// ─── LID → phone JID resolver ─────────────────────────────────────────────────
function resolveJid(rawJid) {
    if (!rawJid) return null;
    if (!rawJid.endsWith('@lid')) return rawJid;
    const mapped = global.lidJidMap?.get(rawJid);
    return mapped || rawJid;   // fallback: use LID as-is
}

// ─── Bot's own bare JID (no device suffix) ───────────────────────────────────
// sock.user.id  = "271476913610986:7@lid"  (includes device)
// sock.user.lid = "271476913610986@lid"    (bare LID — use this in statusJidList)
function getBotBareJid(sock) {
    if (global.botLid) return global.botLid;                // set in silva.js on connection
    const id = sock.user?.id || '';
    if (!id) return '';
    // strip device suffix  e.g. "271476913610986:7@lid" → "271476913610986@lid"
    const atIdx = id.lastIndexOf('@');
    const domain = atIdx >= 0 ? id.slice(atIdx) : '@lid';
    const local  = atIdx >= 0 ? id.slice(0, atIdx) : id;
    const bare   = local.split(':')[0];
    return bare + domain;
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
        const settings  = getAutoStatusSettings();
        const statusId  = m.key.id;
        const rawJid    = m.key.participant;           // may be @lid or @s.whatsapp.net
        const userJid   = resolveJid(rawJid);          // resolved phone JID or same LID
        const botBare   = getBotBareJid(sock);         // our bare JID for statusJidList
        const isLid     = rawJid?.endsWith('@lid');

        if (!rawJid) return;   // skip own status echoes

        const { inner, msgType } = unwrapStatus(m);

        console.log(`[StatusManager] 📨 Status | jid:${userJid} | type:${msgType} | lid:${isLid}`);
        console.log(`[StatusManager] ⚙️  view:${settings.autoviewStatus} | like:${settings.autoLikeStatus} | reply:${settings.autoReplyStatus}`);

        // ── 1. Auto View (read receipt) ─────────────────────────────────────
        if (settings.autoviewStatus === 'true') {
            try {
                // Use sock.sendReceipt directly — more reliable than readMessages()
                // which goes through aggregateMessageKeysNotFromMe and may be silently
                // skipped when the participant format doesn't match expectations.
                await sock.sendReceipt(
                    'status@broadcast',  // jid
                    userJid,             // participant (resolved JID or LID)
                    [statusId],          // message IDs
                    'read'               // type
                );
                console.log(`[StatusManager] ✅ Status viewed: ${statusId}`);
            } catch (viewErr) {
                // Fallback to readMessages if sendReceipt isn't available
                try {
                    await sock.readMessages([{
                        remoteJid:   'status@broadcast',
                        id:          statusId,
                        participant: userJid,
                        fromMe:      false,
                    }]);
                    console.log(`[StatusManager] ✅ Status viewed (fallback): ${statusId}`);
                } catch (e2) {
                    console.warn(`[StatusManager] ⚠️ View failed: ${viewErr.message} | ${e2.message}`);
                }
            }
        }

        // ── 2. Auto Like / React ─────────────────────────────────────────────
        if (settings.autoLikeStatus === 'true') {
            const emojis = settings.statusLikeEmojis
                .split(',').map(e => e.trim()).filter(Boolean);
            const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)] || '❤️';

            const reactKey = {
                remoteJid:   'status@broadcast',
                fromMe:      false,
                id:          statusId,
                participant: userJid,
            };

            // Strategy A: send reaction directly to the status owner's JID.
            // This uses simple 1-to-1 encryption and avoids the statusJidList
            // sender-key distribution which can fail when sessions are broken.
            let liked = false;
            try {
                await sock.sendMessage(
                    userJid,
                    { react: { key: reactKey, text: randomEmoji } }
                );
                console.log(`[StatusManager] ✅ Liked (direct) ${statusId} with ${randomEmoji}`);
                liked = true;
            } catch (e1) {
                console.warn(`[StatusManager] ⚠️ Like direct failed: ${e1.message}`);
            }

            // Strategy B fallback: send to status@broadcast with statusJidList.
            if (!liked) {
                try {
                    const jidList = [userJid, botBare].filter(Boolean);
                    await sock.sendMessage(
                        'status@broadcast',
                        { react: { key: reactKey, text: randomEmoji } },
                        { statusJidList: jidList }
                    );
                    console.log(`[StatusManager] ✅ Liked (broadcast) ${statusId} with ${randomEmoji}`);
                } catch (e2) {
                    console.warn(`[StatusManager] ⚠️ Like broadcast failed: ${e2.message}`);
                }
            }
        }

        // ── 3. Auto Reply ────────────────────────────────────────────────────
        if (settings.autoReplyStatus === 'true' && !m.key.fromMe) {
            try {
                await sock.sendMessage(
                    userJid,
                    { text: settings.statusReplyText },
                    { quoted: m }
                );
                console.log(`[StatusManager] ✅ Replied to ${statusId}`);
            } catch (e) {
                console.warn(`[StatusManager] ⚠️ Reply failed: ${e.message}`);
            }
        }

        // ── 4. Status Saver ──────────────────────────────────────────────────
        if (settings.statusSaver === 'true' && typeof saveMedia === 'function') {
            try {
                const displayJid = userJid || rawJid;
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
                        console.warn(`[StatusManager] ⚠️ Unsupported type for saver: ${msgType}`);
                        break;
                }

                if (settings.statusSaverReply === 'true') {
                    await sock.sendMessage(displayJid, { text: settings.statusSaverMsg });
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

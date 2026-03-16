'use strict';

/**
 * lib/statusManager.js
 * Status@broadcast handler for gifted-baileys (npm:gifted-baileys@^2.5.8)
 */

const config = require('../config');

// ─── Message-type unwrapper ────────────────────────────────────────────────────
function unwrapStatus(msg) {
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

        if (!userJid) return;

        const { inner, msgType } = unwrapStatus(m);

        console.log(`[StatusMgr] >>> statusId=${statusId} sender=${userJid} msgType=${msgType} AUTO_STATUS_SEEN=${config.AUTO_STATUS_SEEN} AUTO_STATUS_REACT=${config.AUTO_STATUS_REACT}`);

        // ── 1. Auto View ───────────────────────────────────────────────────────
        if (config.AUTO_STATUS_SEEN) {
            // Method A: sendReceipt — direct <receipt type="read"> node, bypasses privacy check
            let viewDone = false;
            try {
                await sock.sendReceipt('status@broadcast', userJid, [statusId], 'read');
                console.log('[StatusMgr] VIEW OK via sendReceipt');
                viewDone = true;
            } catch (e1) {
                console.warn(`[StatusMgr] sendReceipt failed: ${e1.message}`);
            }

            // Method B: readMessages (uses fetchPrivacySettings — may send 'read-self' on Heroku)
            if (!viewDone) {
                try {
                    await sock.readMessages([{
                        remoteJid:   'status@broadcast',
                        id:          statusId,
                        participant: userJid,
                        fromMe:      false,
                    }]);
                    console.log('[StatusMgr] VIEW OK via readMessages');
                    viewDone = true;
                } catch (e2) {
                    console.warn(`[StatusMgr] readMessages failed: ${e2.message}`);
                }
            }

            if (!viewDone) {
                console.error('[StatusMgr] VIEW FAILED — all methods exhausted');
            }
        }

        // ── 2. Auto React ──────────────────────────────────────────────────────
        if (config.AUTO_STATUS_REACT) {
            try {
                const emojis      = (config.CUSTOM_REACT_EMOJIS || '❤️,🔥,💯,😍,👏').split(',');
                const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)].trim();

                // Build statusJidList with phone JIDs where possible.
                // LID in statusJidList triggers LID-addressing mode in gifted-baileys, which
                // requires the full LID→device USync resolution to succeed on Heroku.
                // Using phone JIDs avoids that path and is more reliable across sessions.
                const botRaw      = sock.user?.id || global.botJid || '';
                const botPhone    = botRaw.replace(/:\d+@/, '@');   // strip :device suffix

                // global.lidJidMap (Map<lid, phoneJid>) is built in silva.js from contacts events
                const posterPhone = (userJid.includes('@lid') && global.lidJidMap?.has(userJid))
                    ? global.lidJidMap.get(userJid)   // phone JID — avoids LID-addressing mode
                    : userJid;                         // use as-is (may be @lid or @s.whatsapp.net)

                const statusJidList = [posterPhone, botPhone].filter(Boolean);
                console.log(`[StatusMgr] REACT emoji=${randomEmoji} statusJidList=${JSON.stringify(statusJidList)} key=${JSON.stringify(m.key)}`);

                await sock.sendMessage(
                    'status@broadcast',
                    {
                        react: {
                            text: randomEmoji,
                            key:  m.key,
                        },
                    },
                    { statusJidList }
                );
                console.log('[StatusMgr] REACT sent OK');
            } catch (e) {
                console.error(`[StatusMgr] REACT FAILED: ${e.message}\n${e.stack}`);
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
                console.log('[StatusMgr] REPLY sent OK');
            } catch (e) {
                console.warn(`[StatusMgr] REPLY failed: ${e.message}`);
            }
        }

        // ── 4. Status Saver ────────────────────────────────────────────────────
        if (config.Status_Saver === 'true' && typeof saveMedia === 'function') {
            try {
                const userName     = await sock.getName?.(userJid) || userJid.split('@')[0];
                const statusHeader = 'AUTO STATUS SAVER';
                let   caption      = `${statusHeader}\n\n*🩵 Status From:* ${userName}`;

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
                        console.warn(`[StatusMgr] No saver handler for type: ${msgType}`);
                        break;
                }

                if (config.STATUS_REPLY === 'true') {
                    const replyMsg = config.STATUS_MSG || 'SILVA MD 💖 SUCCESSFULLY VIEWED YOUR STATUS';
                    await sock.sendMessage(userJid, { text: replyMsg });
                }
            } catch (e) {
                console.error(`[StatusMgr] Status save failed: ${e.message}`);
            }
        }

    } catch (e) {
        console.error(`[StatusMgr] Handler error: ${e.message}\n${e.stack}`);
    }
}

// ─── Runtime flag setter ───────────────────────────────────────────────────────
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

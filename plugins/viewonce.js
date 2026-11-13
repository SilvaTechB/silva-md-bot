'use strict';

const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const config = require('../config');

// In-memory toggle — seeded from config, changeable at runtime
if (typeof global.antivvEnabled === 'undefined') {
    global.antivvEnabled = config.ANTIVV !== false;
}

// Cache of view-once media captured on arrival (stanzaId -> media data)
if (!global.viewOnceCache) global.viewOnceCache = new Map();
const CACHE_LIMIT = 200;
const MEDIA_TYPES = ['imageMessage', 'videoMessage', 'audioMessage'];

// Strip every view-once / ephemeral wrapper
function unwrap(msg) {
    let m = msg;
    for (let i = 0; i < 5 && m; i++) {
        const inner =
            m.viewOnceMessageV2?.message ||
            m.viewOnceMessageV2Extension?.message ||
            m.viewOnceMessage?.message ||
            m.ephemeralMessage?.message ||
            m.documentWithCaptionMessage?.message;
        if (!inner) break;
        m = inner;
    }
    return m;
}

function isWrappedViewOnce(raw) {
    let m = raw;
    for (let i = 0; i < 5 && m; i++) {
        if (m.viewOnceMessageV2 || m.viewOnceMessageV2Extension || m.viewOnceMessage) return true;
        m = m.ephemeralMessage?.message || m.documentWithCaptionMessage?.message;
    }
    return false;
}

async function downloadBuffer(content, type) {
    const stream = await downloadContentFromMessage(content, type.replace('Message', ''));
    let buffer = Buffer.alloc(0);
    for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);
    return buffer;
}

/**
 * Call this from your messages.upsert handler for EVERY incoming message:
 *     await require('./commands/vv').cacheViewOnce(m);
 * It downloads view-once media the moment it arrives (while the media key
 * is still valid) and stores the bytes so .vv works later.
 */
async function cacheViewOnce(m, downloader = downloadBuffer) {
    try {
        const raw = m?.message;
        if (!raw || !m.key?.id) return;

        const inner = unwrap(raw);
        for (const type of MEDIA_TYPES) {
            const content = inner?.[type];
            if (!content) continue;
            if (!(isWrappedViewOnce(raw) || content.viewOnce)) return; // not view-once
            if (!content.mediaKey || content.mediaKey.length === 0) return;

            const buffer = await downloader(content, type);
            global.viewOnceCache.set(m.key.id, {
                type,
                buffer,
                mimetype: content.mimetype,
                caption:  content.caption || '',
                ptt:      content.ptt || false
            });

            if (global.viewOnceCache.size > CACHE_LIMIT) {
                global.viewOnceCache.delete(global.viewOnceCache.keys().next().value);
            }
            return;
        }
    } catch (_) {
        // never let caching break message handling
    }
}

async function sendMedia(sock, sender, message, { type, buffer, mimetype, caption, ptt }) {
    if (type === 'imageMessage') {
        await sock.sendMessage(sender, {
            image:    buffer,
            caption:  caption || '',
            mimetype: mimetype || 'image/jpeg'
        }, { quoted: message });
    } else if (type === 'videoMessage') {
        await sock.sendMessage(sender, {
            video:    buffer,
            caption:  caption || '',
            mimetype: mimetype || 'video/mp4'
        }, { quoted: message });
    } else {
        await sock.sendMessage(sender, {
            audio:    buffer,
            mimetype: mimetype || 'audio/mp4',
            ptt:      ptt || false
        }, { quoted: message });
    }
}

module.exports = {
    commands:    ['vv', 'viewonce', 'open', 'openphoto', 'openvideo', 'vvphoto'],
    description: 'Manually reveal a view-once message (reply to it)',
    permission:  'owner',
    group:       true,
    private:     true,

    cacheViewOnce,

    run: async (sock, message, args, { sender, contextInfo }) => {
        const ctx = message.message?.extendedTextMessage?.contextInfo;
        const rawQuoted = ctx?.quotedMessage;

        if (!rawQuoted) {
            return sock.sendMessage(sender, {
                text: '❌ *Reply to a view-once photo / video / audio with this command.*',
                contextInfo
            }, { quoted: message });
        }

        try {
            // 1) Best path: bytes cached when the message first arrived
            const cached = global.viewOnceCache.get(ctx.stanzaId);
            if (cached) {
                await sendMedia(sock, sender, message, cached);
                await sock.sendMessage(sender, { react: { text: '😍', key: message.key } });
                return;
            }

            // 2) Fallback: try the quoted copy (works only if the key is present)
            const quoted = unwrap(rawQuoted);
            const type = MEDIA_TYPES.find(k => quoted?.[k]);

            if (!type) {
                return sock.sendMessage(sender, {
                    text: '❌ Quoted message has no image, video, or audio.',
                    contextInfo
                }, { quoted: message });
            }

            const msgContent = quoted[type];

            if (!msgContent.mediaKey || msgContent.mediaKey.length === 0) {
                await sock.sendMessage(sender, { react: { text: '😔', key: message.key } });
                return sock.sendMessage(sender, {
                    text: '❌ WhatsApp did not include the media key for this message, and it was not captured when it arrived (the bot may have been offline or the cache was cleared). Ask the sender to resend it.',
                    contextInfo
                }, { quoted: message });
            }

            const buffer = await downloadBuffer(msgContent, type);
            await sendMedia(sock, sender, message, {
                type,
                buffer,
                mimetype: msgContent.mimetype,
                caption:  msgContent.caption,
                ptt:      msgContent.ptt
            });
            await sock.sendMessage(sender, { react: { text: '😍', key: message.key } });
        } catch (err) {
            await sock.sendMessage(sender, { react: { text: '😔', key: message.key } });
            await sock.sendMessage(sender, {
                text: `❌ Failed to open media: ${err.message}`,
                contextInfo
            }, { quoted: message });
        }
    }
};

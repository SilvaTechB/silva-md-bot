'use strict';

/**
 * Shared media-download helper for Silva MD plugins.
 * Uses downloadContentFromMessage (the correct Baileys API).
 */

const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

const TYPE_MAP = {
    imageMessage:     'image',
    videoMessage:     'video',
    audioMessage:     'audio',
    documentMessage:  'document',
    stickerMessage:   'sticker',
    ptvMessage:       'video',
};

/**
 * Download a media message into a Buffer.
 * @param {object} msgContent  The specific typed sub-message (e.g. msg.imageMessage)
 * @param {string} mediaType   Baileys media type string ('image', 'video', 'audio', 'sticker', 'document')
 * @returns {Promise<Buffer>}
 */
async function dlBuffer(msgContent, mediaType) {
    const stream = await downloadContentFromMessage(msgContent, mediaType);
    const chunks = [];
    for await (const chunk of stream) chunks.push(chunk);
    const buf = Buffer.concat(chunks);
    if (!buf.length) throw new Error('Downloaded media buffer is empty');
    return buf;
}

/**
 * Auto-detect the media type from a message object and download it.
 * Searches the message top-level first, then inside quoted context.
 * @param {object} msgObj  message.message  (the inner message)
 * @returns {Promise<{ buffer: Buffer, mediaType: string, msgContent: object }>}
 */
async function dlAuto(msgObj) {
    // Check direct message
    for (const [key, type] of Object.entries(TYPE_MAP)) {
        if (msgObj?.[key]) {
            return { buffer: await dlBuffer(msgObj[key], type), mediaType: type, msgContent: msgObj[key] };
        }
    }
    // Check inside quoted context
    const quoted = msgObj?.extendedTextMessage?.contextInfo?.quotedMessage;
    for (const [key, type] of Object.entries(TYPE_MAP)) {
        if (quoted?.[key]) {
            return { buffer: await dlBuffer(quoted[key], type), mediaType: type, msgContent: quoted[key] };
        }
    }
    throw new Error('No downloadable media found in this message');
}

module.exports = { dlBuffer, dlAuto, TYPE_MAP };

'use strict';

const crypto = require('crypto');
const ffmpeg = require('fluent-ffmpeg');
const { PassThrough } = require('stream');
const baileys = require('@whiskeysockets/baileys');

module.exports = {
    commands:    ['togstatus', 'swgc', 'groupstatus'],
    description: 'Send text, image, video or audio as group status',
    permission:  'public',
    group:       true,
    private:     false,

    run: async (sock, message, args, ctx) => {
        const { contextInfo } = ctx;
        const jid = message.key.remoteJid;

        const reply = (text) =>
            sock.sendMessage(
                jid,
                {
                    text,
                    contextInfo: {
                        ...contextInfo,
                        mentionedJid: [message.key.participant || jid],
                        forwardingScore: 999,
                        isForwarded: true,
                        forwardedNewsletterMessageInfo: {
                            newsletterJid: '120363200367779016@newsletter',
                            newsletterName: 'SILVA GROUP STATUS💖',
                            serverMessageId: 143,
                        },
                    },
                },
                { quoted: message }
            );

        try {
            // Parse args: caption|color|groupUrl
            const raw = args.join(' ').trim();
            let [caption, color, groupUrl] = raw
                .split('|')
                .map((v) => v?.trim());

            // Resolve target group
            let targetGroupId = jid;
            if (groupUrl) {
                try {
                    const code = groupUrl.split('/').pop().split('?')[0];
                    const info = await sock.groupGetInviteInfo(code);
                    targetGroupId = info.id;
                    await reply(`🎯 Target group: *${info.subject}*`);
                } catch {
                    return reply('❌ Invalid group link or bot is not in that group.');
                }
            }

            // Detect quoted message
            const quoted =
                message.message?.extendedTextMessage?.contextInfo?.quotedMessage;

            // ── TEXT STATUS ──────────────────────────────────────────────────
            if (!quoted) {
                if (!caption) {
                    return reply(
                        `📝 *Group Status Usage*\n\n` +
                        `.togstatus caption|color\n` +
                        `.togstatus |blue\n` +
                        `Reply to image / video / audio\n\n` +
                        `🎨 Colors:\nblue, green, yellow, orange, red,\npurple, gray, black, white, cyan`
                    );
                }

                const colors = {
                    blue:   '#34B7F1',
                    green:  '#25D366',
                    yellow: '#FFD700',
                    orange: '#FF8C00',
                    red:    '#FF3B30',
                    purple: '#9C27B0',
                    gray:   '#9E9E9E',
                    black:  '#000000',
                    white:  '#FFFFFF',
                    cyan:   '#00BCD4',
                };

                await groupStatus(sock, targetGroupId, {
                    text: caption,
                    backgroundColor: colors[color?.toLowerCase()] || colors.blue,
                });

                return reply('✅ Text status sent!');
            }

            // ── IMAGE STATUS ─────────────────────────────────────────────────
            if (quoted.imageMessage) {
                const buf = await baileys.downloadMediaMessage(
                    { message: quoted, key: message.key },
                    'buffer',
                    {},
                    { reuploadRequest: sock.updateMediaMessage }
                );

                await groupStatus(sock, targetGroupId, {
                    image: buf,
                    caption: caption || '',
                });

                return reply('✅ Image status sent!');
            }

            // ── VIDEO STATUS ─────────────────────────────────────────────────
            if (quoted.videoMessage) {
                const buf = await baileys.downloadMediaMessage(
                    { message: quoted, key: message.key },
                    'buffer',
                    {},
                    { reuploadRequest: sock.updateMediaMessage }
                );

                await groupStatus(sock, targetGroupId, {
                    video: buf,
                    caption: caption || '',
                });

                return reply('✅ Video status sent!');
            }

            // ── AUDIO STATUS ─────────────────────────────────────────────────
            if (quoted.audioMessage) {
                const buf = await baileys.downloadMediaMessage(
                    { message: quoted, key: message.key },
                    'buffer',
                    {},
                    { reuploadRequest: sock.updateMediaMessage }
                );

                const vn = await toVN(buf);
                const waveform = await generateWaveform(buf);

                await groupStatus(sock, targetGroupId, {
                    audio: vn,
                    mimetype: 'audio/ogg; codecs=opus',
                    ptt: true,
                    waveform,
                });

                return reply('✅ Audio status sent!');
            }

            return reply('❌ Unsupported media type. Reply to an image, video, or audio.');

        } catch (err) {
            return reply(`❌ Status error:\n${err.message}`);
        }
    },
};

// ─── HELPERS ────────────────────────────────────────────────────────────────

/**
 * Sends content as a group status (groupStatusMessageV2).
 */
async function groupStatus(conn, jid, content) {
    const { backgroundColor } = content;
    delete content.backgroundColor;

    const inside = await baileys.generateWAMessageContent(content, {
        upload: conn.waUploadToServer,
        backgroundColor,
    });

    const secret = crypto.randomBytes(32);

    const msg = baileys.generateWAMessageFromContent(
        jid,
        {
            messageContextInfo: { messageSecret: secret },
            groupStatusMessageV2: {
                message: {
                    ...inside,
                    messageContextInfo: { messageSecret: secret },
                },
            },
        },
        {}
    );

    await conn.relayMessage(jid, msg.message, { messageId: msg.key.id });
    return msg;
}

/**
 * Converts any audio buffer to Opus/OGG (voice note format).
 */
function toVN(buffer) {
    return new Promise((resolve, reject) => {
        const input  = new PassThrough();
        const output = new PassThrough();
        const chunks = [];

        input.end(buffer);

        ffmpeg(input)
            .noVideo()
            .audioCodec('libopus')
            .format('ogg')
            .audioChannels(1)
            .audioFrequency(48000)
            .on('error', reject)
            .on('end', () => resolve(Buffer.concat(chunks)))
            .pipe(output);

        output.on('data', (c) => chunks.push(c));
    });
}

/**
 * Generates a base64-encoded waveform string from an audio buffer.
 * @param {Buffer} buffer
 * @param {number} bars   Number of waveform bars (default 64)
 */
function generateWaveform(buffer, bars = 64) {
    return new Promise((resolve, reject) => {
        const input  = new PassThrough();
        const chunks = [];

        input.end(buffer);

        const stream = ffmpeg(input)
            .audioChannels(1)
            .audioFrequency(16000)
            .format('s16le')
            .on('error', reject)
            .on('end', () => {
                const raw     = Buffer.concat(chunks);
                const samples = raw.length / 2;
                const amps    = [];

                for (let i = 0; i < samples; i++) {
                    amps.push(Math.abs(raw.readInt16LE(i * 2)) / 32768);
                }

                const size = Math.floor(amps.length / bars);
                const avg  = Array.from({ length: bars }, (_, i) => {
                    const slice = amps.slice(i * size, (i + 1) * size);
                    return slice.reduce((a, b) => a + b, 0) / slice.length;
                });

                const max = Math.max(...avg);
                resolve(
                    Buffer.from(avg.map((v) => Math.floor((v / max) * 100))).toString('base64')
                );
            })
            .pipe();   // returns writable stream

        stream.on('data', (c) => chunks.push(c));
    });
}

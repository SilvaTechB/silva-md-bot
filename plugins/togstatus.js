'use strict';
const crypto = require('crypto');
const { PassThrough } = require('stream');
const ffmpeg = require('fluent-ffmpeg');
const {
    downloadContentFromMessage,
    generateWAMessageContent,
    generateWAMessageFromContent
} = require('@whiskeysockets/baileys');
const { fmt } = require('../lib/theme');

const COLORS = {
    blue:   '#34B7F1', green:  '#25D366', yellow: '#FFD700',
    orange: '#FF8C00', red:    '#FF3B30', purple: '#9C27B0',
    gray:   '#9E9E9E', black:  '#000000', white:  '#FFFFFF',
    cyan:   '#00BCD4', pink:   '#E91E8C'
};

async function dlBuffer(msgObj, type) {
    const stream = await downloadContentFromMessage(msgObj, type);
    let buf = Buffer.alloc(0);
    for await (const chunk of stream) buf = Buffer.concat([buf, chunk]);
    return buf;
}

function toVN(buffer) {
    return new Promise((resolve, reject) => {
        const input = new PassThrough();
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
        output.on('data', c => chunks.push(c));
    });
}

function generateWaveform(buffer, bars = 64) {
    return new Promise((resolve, reject) => {
        const input = new PassThrough();
        input.end(buffer);
        const chunks = [];
        ffmpeg(input)
            .audioChannels(1)
            .audioFrequency(16000)
            .format('s16le')
            .on('error', reject)
            .on('end', () => {
                const raw = Buffer.concat(chunks);
                const samples = raw.length / 2;
                const amps = [];
                for (let i = 0; i < samples; i++) amps.push(Math.abs(raw.readInt16LE(i * 2)) / 32768);
                const size = Math.max(1, Math.floor(amps.length / bars));
                const avg = Array.from({ length: bars }, (_, i) =>
                    amps.slice(i * size, (i + 1) * size).reduce((a, b) => a + b, 0) / size
                );
                const max = Math.max(...avg) || 1;
                resolve(Buffer.from(avg.map(v => Math.floor((v / max) * 100))).toString('base64'));
            })
            .pipe()
            .on('data', c => chunks.push(c));
    });
}

// Send content as a group status (story) using groupStatusMessage (FutureProofMessage wrapper)
async function sendGroupStatus(sock, jid, content) {
    const { backgroundColor } = content;
    delete content.backgroundColor;

    const inside = await generateWAMessageContent(content, {
        upload: sock.waUploadToServer,
        backgroundColor
    });

    const secret = crypto.randomBytes(32);

    // This Baileys fork uses groupStatusMessage (FutureProofMessage) — not V2
    const msg = generateWAMessageFromContent(
        jid,
        {
            messageContextInfo: { messageSecret: secret },
            groupStatusMessage: {
                message: {
                    ...inside,
                    messageContextInfo: { messageSecret: secret }
                }
            }
        },
        {}
    );

    await sock.relayMessage(jid, msg.message, { messageId: msg.key.id });
    return msg;
}

module.exports = {
    commands:    ['togstatus', 'swgc', 'poststatus'],
    description: 'Post a text/image/video/audio as a group status (story)',
    usage:       '.togstatus caption|color  OR  reply to media with .togstatus',
    permission:  'owner',   // only bot owner can post group status
    group:       true,

    run: async (sock, message, args, ctx) => {
        const { jid, contextInfo } = ctx;
        const reply = (text) => sock.sendMessage(jid, { text: fmt(text), contextInfo }, { quoted: message });

        try {
            const msg    = message.message;
            const quoted = msg?.extendedTextMessage?.contextInfo?.quotedMessage;

            // Support full piped string from args or ctx.text
            const rawText = ctx.text
                ? ctx.text.replace(/^[.!#/\\]?\w+\s*/,'').trim()
                : args.join(' ');

            let [caption, color, groupUrl] = rawText.split('|').map(v => v?.trim() || '');

            let targetGroupId = jid;

            if (groupUrl) {
                try {
                    const code = groupUrl.split('/').pop().split('?')[0];
                    const info = await sock.groupGetInviteInfo(code);
                    targetGroupId = info.id;
                    await reply(`🎯 Targeting group: *${info.subject}*`);
                } catch {
                    return reply('❌ Invalid group link or bot is not in that group.');
                }
            }

            // ── TEXT STATUS ──────────────────────────────────────────────────────
            if (!quoted) {
                if (!caption) {
                    return reply(
                        `📢 *Group Status Usage*\n\n` +
                        `*.togstatus caption|color*\n` +
                        `*.togstatus |green*  ← color only\n` +
                        `*Reply to image/video/audio* then *.togstatus caption*\n` +
                        `*.togstatus caption||group_invite_link*\n\n` +
                        `🎨 *Colors:*\n${Object.keys(COLORS).join(', ')}`
                    );
                }

                await sendGroupStatus(sock, targetGroupId, {
                    text:            caption,
                    backgroundColor: COLORS[color?.toLowerCase()] || COLORS.blue
                });
                return reply('✅ Text status posted to group!');
            }

            // ── IMAGE STATUS ─────────────────────────────────────────────────────
            if (quoted.imageMessage) {
                const buf = await dlBuffer(quoted.imageMessage, 'image');
                await sendGroupStatus(sock, targetGroupId, { image: buf, caption: caption || '' });
                return reply('✅ Image status posted to group!');
            }

            // ── VIDEO STATUS ─────────────────────────────────────────────────────
            if (quoted.videoMessage) {
                const buf = await dlBuffer(quoted.videoMessage, 'video');
                await sendGroupStatus(sock, targetGroupId, { video: buf, caption: caption || '' });
                return reply('✅ Video status posted to group!');
            }

            // ── AUDIO STATUS ─────────────────────────────────────────────────────
            if (quoted.audioMessage) {
                const buf = await dlBuffer(quoted.audioMessage, 'audio');
                try {
                    const [vn, waveform] = await Promise.all([toVN(buf), generateWaveform(buf)]);
                    await sendGroupStatus(sock, targetGroupId, {
                        audio:    vn,
                        mimetype: 'audio/ogg; codecs=opus',
                        ptt:      true,
                        waveform
                    });
                } catch {
                    // ffmpeg not available — send raw audio without waveform
                    await sendGroupStatus(sock, targetGroupId, {
                        audio:    buf,
                        mimetype: quoted.audioMessage.mimetype || 'audio/ogg',
                        ptt:      quoted.audioMessage.ptt || false
                    });
                }
                return reply('✅ Audio status posted to group!');
            }

            return reply('❌ Unsupported media type. Reply to an image, video, or audio message.');

        } catch (err) {
            console.error('[togstatus]', err.message);
            return sock.sendMessage(
                ctx.jid,
                { text: fmt(`❌ Group status error: ${err.message}`) },
                { quoted: message }
            );
        }
    }
};

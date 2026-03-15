"use strict";

const crypto = require("crypto");
const ffmpeg = require("fluent-ffmpeg");
const { PassThrough } = require("stream");
const baileys = require("@whiskeysockets/baileys");

// ─── COLOR MAP (hex) ─────────────────────────────────────────────────────────
const COLORS = {
    blue: "#34B7F1",
    green: "#25D366",
    yellow: "#FFD700",
    orange: "#FF8C00",
    red: "#FF3B30",
    purple: "#9C27B0",
    gray: "#9E9E9E",
    black: "#000000",
    white: "#FFFFFF",
    cyan: "#00BCD4",
};

module.exports = {
    commands: ["togstatus", "swgc", "groupstatus"],
    description: "Send text / image / video / audio as group status",
    permission: "public",
    group: true,
    private: false,

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
                            newsletterJid: "120363200367779016@newsletter",
                            newsletterName: "SILVA GROUP STATUS\uD83D\uDC96",
                            serverMessageId: 143,
                        },
                    },
                },
                { quoted: message },
            );

        try {
            // Parse args: caption|color|groupUrl
            const raw = args.join(" ").trim();
            let [caption, color, groupUrl] = raw
                .split("|")
                .map((v) => v?.trim());

            // Resolve target group (optional external link)
            let targetGroupId = jid;
            if (groupUrl) {
                try {
                    const code = groupUrl.split("/").pop().split("?")[0];
                    const info = await sock.groupGetInviteInfo(code);
                    targetGroupId = info.id;
                    await reply(`\uD83C\uDFAF Target group: *${info.subject}*`);
                } catch {
                    return reply(
                        "\u274C Invalid group link or bot is not in that group.",
                    );
                }
            }

            // Detect quoted message (handles both reply context and direct media)
            const quoted =
                message.message?.extendedTextMessage?.contextInfo
                    ?.quotedMessage ||
                (message.message?.imageMessage ? message.message : null) ||
                (message.message?.videoMessage ? message.message : null) ||
                (message.message?.audioMessage ? message.message : null);

            // ── TEXT STATUS ──────────────────────────────────────────────────
            const hasMedia =
                quoted &&
                (quoted.imageMessage ||
                    quoted.videoMessage ||
                    quoted.audioMessage);

            if (!hasMedia) {
                if (!caption) {
                    return reply(
                        `\uD83D\uDCDD *Group Status Usage*\n\n` +
                            `.togstatus caption|color\n` +
                            `.togstatus |blue\n` +
                            `Reply to image / video / audio\n\n` +
                            `\uD83C\uDFA8 Colors:\nblue, green, yellow, orange, red,\npurple, gray, black, white, cyan`,
                    );
                }

                const bgHex = COLORS[color?.toLowerCase()] || COLORS.blue;

                // FIX 1: extendedTextMessage + ARGB integer (NOT hex option on generateWAMessageContent)
                await groupStatus(sock, targetGroupId, {
                    extendedTextMessage: {
                        text: caption,
                        backgroundArgb: hexToArgb(bgHex),
                        font: 0,
                    },
                });

                return reply("\u2705 Text status sent!");
            }

            // ── IMAGE STATUS ─────────────────────────────────────────────────
            if (quoted.imageMessage) {
                const buf = await baileys.downloadMediaMessage(
                    buildMsgObj(message, quoted),
                    "buffer",
                    {},
                    { reuploadRequest: sock.updateMediaMessage },
                );

                // FIX 2: use generateWAMessageContent then pass proto via toJSON
                const content = await baileys.generateWAMessageContent(
                    { image: buf, caption: caption || "" },
                    { upload: sock.waUploadToServer },
                );
                await groupStatus(sock, targetGroupId, content);
                return reply("\u2705 Image status sent!");
            }

            // ── VIDEO STATUS ─────────────────────────────────────────────────
            if (quoted.videoMessage) {
                const buf = await baileys.downloadMediaMessage(
                    buildMsgObj(message, quoted),
                    "buffer",
                    {},
                    { reuploadRequest: sock.updateMediaMessage },
                );

                const content = await baileys.generateWAMessageContent(
                    { video: buf, caption: caption || "" },
                    { upload: sock.waUploadToServer },
                );
                await groupStatus(sock, targetGroupId, content);
                return reply("\u2705 Video status sent!");
            }

            // ── AUDIO STATUS ─────────────────────────────────────────────────
            if (quoted.audioMessage) {
                const buf = await baileys.downloadMediaMessage(
                    buildMsgObj(message, quoted),
                    "buffer",
                    {},
                    { reuploadRequest: sock.updateMediaMessage },
                );

                const vn = await toVN(buf);
                const waveform = await generateWaveform(buf); // FIX 3: pipe bug fixed

                const content = await baileys.generateWAMessageContent(
                    {
                        audio: vn,
                        mimetype: "audio/ogg; codecs=opus",
                        ptt: true,
                    },
                    { upload: sock.waUploadToServer },
                );

                // Attach waveform bytes to the audioMessage
                if (content.audioMessage) {
                    content.audioMessage.waveform = Buffer.from(
                        waveform,
                        "base64",
                    );
                }

                await groupStatus(sock, targetGroupId, content);
                return reply("\u2705 Audio status sent!");
            }

            return reply(
                "\u274C Unsupported media type. Reply to an image, video, or audio.",
            );
        } catch (err) {
            console.error("[togstatus]", err);
            return reply(`\u274C Status error:\n${err.message}`);
        }
    },
};

// ─── HELPERS ────────────────────────────────────────────────────────────────

/**
 * FIX 1 — Convert #RRGGBB hex string → unsigned 32-bit ARGB integer.
 * WhatsApp's backgroundArgb field requires an integer, not a hex string.
 */
function hexToArgb(hex) {
    const h = hex.replace("#", "");
    const r = parseInt(h.slice(0, 2), 16);
    const g = parseInt(h.slice(2, 4), 16);
    const b = parseInt(h.slice(4, 6), 16);
    return ((0xff << 24) | (r << 16) | (g << 8) | b) >>> 0;
}

/**
 * FIX 4 — Build a proper message object for downloadMediaMessage.
 * The key must reference the quoted message's stanza, not the parent message.
 */
function buildMsgObj(originalMessage, quotedContent) {
    const ctxInfo = originalMessage.message?.extendedTextMessage?.contextInfo;
    return {
        key: {
            remoteJid: originalMessage.key.remoteJid,
            fromMe: false,
            id: ctxInfo?.stanzaId || originalMessage.key.id,
            participant: ctxInfo?.participant,
        },
        message: quotedContent,
    };
}

/**
 * Send content as a WhatsApp group status (groupStatusMessageV2).
 * FIX 2 — Proto spread: call toJSON() on proto objects before spreading,
 * so all fields survive the spread into the plain JS object.
 */
async function groupStatus(conn, jid, content) {
    const secret = crypto.randomBytes(32);

    // Convert proto → plain object if necessary
    const innerMsg =
        typeof content.toJSON === "function" ? content.toJSON() : content;

    const fullContent = {
        messageContextInfo: { messageSecret: secret },
        groupStatusMessage: {
            message: {
                ...innerMsg,
                messageContextInfo: { messageSecret: secret },
            },
        },
    };

    const msg = baileys.generateWAMessageFromContent(jid, fullContent, {});
    await conn.relayMessage(jid, msg.message, { messageId: msg.key.id });
    return msg;
}

/**
 * Convert any audio buffer → Opus/OGG voice note format.
 */
function toVN(buffer) {
    return new Promise((resolve, reject) => {
        const input = new PassThrough();
        const output = new PassThrough();
        const chunks = [];

        input.end(buffer);

        ffmpeg(input)
            .noVideo()
            .audioCodec("libopus")
            .format("ogg")
            .audioChannels(1)
            .audioFrequency(48000)
            .on("error", reject)
            .on("end", () => resolve(Buffer.concat(chunks)))
            .pipe(output);

        output.on("data", (c) => chunks.push(c));
        output.on("error", reject);
    });
}

/**
 * Generate a base64-encoded waveform from an audio buffer.
 * FIX 3 — .pipe() with no argument returns nothing; pipe to a PassThrough instead.
 */
function generateWaveform(buffer, bars = 64) {
    return new Promise((resolve, reject) => {
        const input = new PassThrough();
        const output = new PassThrough(); // <-- named output stream (was missing)
        const chunks = [];

        input.end(buffer);

        ffmpeg(input)
            .audioChannels(1)
            .audioFrequency(16000)
            .format("s16le")
            .on("error", reject)
            .on("end", () => {
                const raw = Buffer.concat(chunks);
                const samples = raw.length / 2;
                const amps = [];

                for (let i = 0; i < samples; i++) {
                    amps.push(Math.abs(raw.readInt16LE(i * 2)) / 32768);
                }

                const size = Math.max(1, Math.floor(amps.length / bars));
                const avg = Array.from({ length: bars }, (_, i) => {
                    const slice = amps.slice(i * size, (i + 1) * size);
                    return slice.length
                        ? slice.reduce((a, b) => a + b, 0) / slice.length
                        : 0;
                });

                const max = Math.max(...avg) || 1; // guard against divide-by-zero
                resolve(
                    Buffer.from(
                        avg.map((v) => Math.floor((v / max) * 100)),
                    ).toString("base64"),
                );
            })
            .pipe(output); // <-- pipe to named stream

        output.on("data", (c) => chunks.push(c));
        output.on("error", reject);
    });
}

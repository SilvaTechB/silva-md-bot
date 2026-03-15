"use strict";

/**
 * lib/statusManager.js
 * Centralised handler for status@broadcast messages.
 * Covers: auto-view, auto-like (react), auto-reply, status-saver.
 */

const config = require("../config");

// ─── Settings resolver ────────────────────────────────────────────────────────
function getAutoStatusSettings() {
    const flags = global.autoStatusFlags || {};

    const resolve = (runtimeVal, configVal) => {
        if (runtimeVal !== null && runtimeVal !== undefined)
            return String(runtimeVal);
        if (configVal !== null && configVal !== undefined)
            return String(configVal);
        return "false";
    };

    return {
        autoviewStatus: resolve(flags.seen, config.AUTO_STATUS_SEEN),
        autoLikeStatus: resolve(flags.react, config.AUTO_STATUS_REACT),
        autoReplyStatus: resolve(null, config.AUTO_STATUS_REPLY),
        statusReplyText: config.AUTO_STATUS_MSG || "Seen by Silva MD 💖",
        statusLikeEmojis: config.CUSTOM_REACT_EMOJIS || "❤️,🔥,💯,😍,👏",
        statusSaver: String(config.Status_Saver || "false"),
        statusSaverReply: String(config.STATUS_REPLY || "false"),
        statusSaverMsg:
            config.STATUS_MSG || "SILVA MD 💖 SUCCESSFULLY VIEWED YOUR STATUS",
    };
}

// ─── Message-type unwrapper ───────────────────────────────────────────────────
function unwrapStatus(m) {
    // Work on a copy — never mutate the original m.message so later steps
    // (react, reply) still see the original key structure.
    let msg = { ...(m.message || {}) };

    if (msg.ephemeralMessage) {
        msg = { ...(msg.ephemeralMessage.message || msg) };
    }

    const voKey = Object.keys(msg).find((k) => k.startsWith("viewOnce"));
    if (voKey) msg = { ...(msg[voKey].message || msg) };

    const ORDER = [
        "imageMessage",
        "videoMessage",
        "audioMessage",
        "extendedTextMessage",
        "conversation",
        "stickerMessage",
        "documentMessage",
        "reactionMessage",
    ];
    const msgType =
        ORDER.find((k) => msg[k]) || Object.keys(msg)[0] || "unknown";
    return { inner: msg, msgType };
}

// ─── Main handler ─────────────────────────────────────────────────────────────
/**
 * @param {object}   sock        - Baileys socket instance
 * @param {object}   m           - raw message from messages.upsert
 * @param {Function} [saveMedia] - optional media-save helper from silva.js
 */
async function handleStatusBroadcast(sock, m, saveMedia) {
    try {
        const settings = getAutoStatusSettings();
        const statusId = m.key.id;
        const participant = m.key.participant; // JID of whoever posted the status

        // Own status echoes have no participant — skip them.
        if (!participant) return;

        const { inner, msgType } = unwrapStatus(m);

        console.log(
            `[StatusManager] 📨 Status | from:${participant} | type:${msgType}`,
        );
        console.log(
            `[StatusManager] ⚙️  view:${settings.autoviewStatus} | like:${settings.autoLikeStatus} | reply:${settings.autoReplyStatus}`,
        );

        // ── 1. Auto View (send read receipt) ────────────────────────────────
        if (settings.autoviewStatus === "true") {
            try {
                // FIX: Build an explicit plain-object key with fromMe:false.
                // Passing m.key directly can silently fail in newer Baileys builds
                // because the prototype chain may carry unexpected default values.
                await sock.readMessages([
                    {
                        remoteJid: "status@broadcast",
                        id: statusId,
                        participant: participant,
                        fromMe: false,
                    },
                ]);
                console.log(`[StatusManager] ✅ Status viewed: ${statusId}`);
            } catch (viewErr) {
                console.warn(
                    `[StatusManager] ⚠️ View failed: ${viewErr.message}`,
                );
            }
        }

        // ── 2. Auto Like / React ─────────────────────────────────────────────
        if (settings.autoLikeStatus === "true") {
            const emojis = settings.statusLikeEmojis
                .split(",")
                .map((e) => e.trim())
                .filter(Boolean);
            const randomEmoji =
                emojis[Math.floor(Math.random() * emojis.length)] || "❤️";

            try {
                // FIX: Pass statusJidList in the third argument (options).
                // Without it Baileys/WhatsApp silently drops the reaction to
                // status@broadcast — no error is thrown but the like never sends.
                // The list must contain at minimum the poster's JID.
                const botJid = sock.user?.id || global.botJid || "";

                await sock.sendMessage(
                    "status@broadcast",
                    {
                        react: {
                            key: {
                                remoteJid: "status@broadcast",
                                fromMe: false,
                                id: statusId,
                                participant: participant,
                            },
                            text: randomEmoji,
                        },
                    },
                    {
                        statusJidList: [participant, botJid].filter(Boolean),
                    },
                );
                console.log(
                    `[StatusManager] ✅ Liked status ${statusId} with ${randomEmoji}`,
                );
            } catch (likeErr) {
                console.warn(
                    `[StatusManager] ⚠️ Like failed: ${likeErr.message}`,
                );
            }
        }

        // ── 3. Auto Reply ────────────────────────────────────────────────────
        if (settings.autoReplyStatus === "true" && !m.key.fromMe) {
            try {
                await sock.sendMessage(
                    participant,
                    { text: settings.statusReplyText },
                    { quoted: m },
                );
                console.log(`[StatusManager] ✅ Replied to ${statusId}`);
            } catch (replyErr) {
                console.warn(
                    `[StatusManager] ⚠️ Reply failed: ${replyErr.message}`,
                );
            }
        }

        // ── 4. Status Saver ──────────────────────────────────────────────────
        if (
            settings.statusSaver === "true" &&
            typeof saveMedia === "function"
        ) {
            try {
                const userName =
                    (await sock.getName?.(participant)) ||
                    participant.split("@")[0];
                const header = "AUTO STATUS SAVER";
                let caption = `${header}\n\n*🩵 Status From:* ${userName}`;

                switch (msgType) {
                    case "imageMessage":
                    case "videoMessage":
                        if (inner[msgType]?.caption)
                            caption += `\n*🩵 Caption:* ${inner[msgType].caption}`;
                        await saveMedia(
                            { message: inner },
                            msgType,
                            sock,
                            caption,
                        );
                        break;
                    case "audioMessage":
                        caption += "\n*🩵 Audio Status*";
                        await saveMedia(
                            { message: inner },
                            msgType,
                            sock,
                            caption,
                        );
                        break;
                    case "extendedTextMessage":
                        caption = `${header}\n\n${inner.extendedTextMessage?.text || ""}`;
                        await sock.sendMessage(sock.user.id, { text: caption });
                        break;
                    default:
                        console.warn(
                            `[StatusManager] ℹ️ No saver handler for type: ${msgType}`,
                        );
                        break;
                }

                if (settings.statusSaverReply === "true") {
                    await sock.sendMessage(participant, {
                        text: settings.statusSaverMsg,
                    });
                }
                console.log(`[StatusManager] ✅ Status saved: ${statusId}`);
            } catch (saveErr) {
                console.error(
                    `[StatusManager] ❌ Save failed: ${saveErr.message}`,
                );
            }
        }
    } catch (e) {
        console.error(`[StatusManager] ❌ Handler error: ${e.message}`);
    }
}

module.exports = { handleStatusBroadcast, getAutoStatusSettings, unwrapStatus };

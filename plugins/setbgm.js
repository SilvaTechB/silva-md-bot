'use strict';

/**
 * Word-triggered audio autoresponder ("BGM Triggers")
 *
 * Owner commands:
 *   .setbgm <word>     — reply to an audio/voice note to register it as the trigger audio
 *   .delbgm <word>     — remove a trigger word
 *   .listbgm           — list all active trigger words
 *   .clearbgm          — remove ALL trigger words
 *
 * Behaviour:
 *   When anyone sends a message containing a registered trigger word,
 *   the bot automatically replies with the saved audio for that word.
 *   Cooldown: one reply per chat per word every 30 seconds (anti-spam).
 */

const { fmt }        = require('../lib/theme');
const { setTrigger, delTrigger, listTriggers, matchTrigger } = require('../lib/bgmTrigger');
const baileys        = require('@whiskeysockets/baileys');

// ─── Per-chat cooldown tracker ────────────────────────────────────────────────
// Key: `${jid}:${word}` → timestamp of last send
const cooldowns = new Map();
const COOLDOWN_MS = 30_000; // 30 seconds

function onCooldown(jid, word) {
    const key  = `${jid}:${word}`;
    const last = cooldowns.get(key) || 0;
    if (Date.now() - last < COOLDOWN_MS) return true;
    cooldowns.set(key, Date.now());
    return false;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Extract the audio message object from a quoted message (reply context). */
function extractQuotedAudio(message) {
    const ctxInfo = message.message?.extendedTextMessage?.contextInfo;
    const quoted  = ctxInfo?.quotedMessage;
    if (!quoted) return null;
    if (quoted.audioMessage) {
        const mimetype = quoted.audioMessage.mimetype || 'audio/mp4';
        return { msg: quoted, type: 'audio', mimetype };
    }
    return null;
}

/** Build a proper message object from a quoted payload so Baileys can download it. */
function buildMsgObj(originalMessage, quotedContent) {
    const ctxInfo = originalMessage.message?.extendedTextMessage?.contextInfo;
    return {
        key: {
            remoteJid:   originalMessage.key.remoteJid,
            fromMe:      ctxInfo?.participant
                ? ctxInfo.participant === (originalMessage.key.participant || originalMessage.key.remoteJid)
                : false,
            id:          ctxInfo?.stanzaId || originalMessage.key.id,
            participant: ctxInfo?.participant,
        },
        message: quotedContent,
    };
}

// ─── Plugin export ────────────────────────────────────────────────────────────
module.exports = {
    commands:    ['setbgm', 'delbgm', 'listbgm', 'clearbgm', 'bgmlist', 'removebgm'],
    description: 'Word-triggered audio autoresponder. Set audios that play when trigger words are detected.',
    permission:  'owner',
    group:       true,
    private:     true,

    // ── Management commands ────────────────────────────────────────────────────
    run: async (sock, message, args, { jid, reply, command }) => {
        const cmd  = command || '';
        const word = args[0]?.toLowerCase().trim();

        // ── .listbgm / .bgmlist ────────────────────────────────────────────
        if (cmd === 'listbgm' || cmd === 'bgmlist') {
            const list = listTriggers();
            if (!list.length)
                return reply(fmt('🔇 No BGM triggers set yet.\n\nUse `.setbgm <word>` while replying to an audio.'));

            return reply(fmt(
                `🎵 *BGM Trigger Words (${list.length})*\n\n` +
                list.map((w, i) => `${i + 1}. \`${w}\``).join('\n') +
                `\n\n_Anyone who says one of these words will get an auto audio reply._`
            ));
        }

        // ── .clearbgm ─────────────────────────────────────────────────────
        if (cmd === 'clearbgm') {
            const list = listTriggers();
            if (!list.length) return reply(fmt('⚠️ No triggers to clear.'));
            list.forEach(w => delTrigger(w));
            return reply(fmt(`🗑️ Cleared all *${list.length}* BGM trigger(s).`));
        }

        // ── .delbgm / .removebgm ──────────────────────────────────────────
        if (cmd === 'delbgm' || cmd === 'removebgm') {
            if (!word) return reply(fmt('❌ Usage: `.delbgm <word>`'));
            const removed = delTrigger(word);
            return reply(removed
                ? fmt(`✅ Removed trigger: \`${word}\``)
                : fmt(`⚠️ No trigger found for: \`${word}\``)
            );
        }

        // ── .setbgm ───────────────────────────────────────────────────────
        if (cmd === 'setbgm') {
            if (!word)
                return reply(fmt(
                    `❌ *Usage:* Reply to an audio/voice note and type:\n` +
                    `\`.setbgm <trigger word>\`\n\n` +
                    `*Example:* \`.setbgm hello\`\n` +
                    `Whenever someone says *hello*, the bot will auto-send that audio.`
                ));

            const found = extractQuotedAudio(message);
            if (!found)
                return reply(fmt(
                    `⚠️ *No audio found!*\n\n` +
                    `Please *reply to a voice note or audio* while using this command.\n` +
                    `Example: reply to an audio then type \`.setbgm ${word}\``
                ));

            await reply(fmt(`⏳ Saving audio for trigger: \`${word}\`…`));

            try {
                const msgObj = buildMsgObj(message, found.msg);
                const buf = await baileys.downloadMediaMessage(
                    msgObj,
                    'buffer',
                    {},
                    { reuploadRequest: sock.updateMediaMessage }
                );

                const savedWord = setTrigger(word, buf, found.mimetype);

                return reply(fmt(
                    `✅ *BGM Trigger Set!*\n\n` +
                    `🎵 *Word:* \`${savedWord}\`\n` +
                    `📦 *Audio:* ${(buf.length / 1024).toFixed(1)} KB\n\n` +
                    `_Whenever anyone says "${savedWord}", I'll auto-send this audio._\n` +
                    `_Use \`.delbgm ${savedWord}\` to remove it._`
                ));
            } catch (err) {
                console.error('[setbgm] download error:', err.message);
                return reply(fmt(`❌ Failed to save audio: ${err.message}`));
            }
        }
    },

    // ── onMessage — fires on every incoming message, checks for trigger words ──
    onMessage: async (sock, message, text, { jid, isGroup, contextInfo }) => {
        // Skip empty text
        if (!text || !text.trim()) return;

        // Skip messages sent by the bot itself
        if (message.key.fromMe) return;

        const match = matchTrigger(text);
        if (!match) return;

        // Cooldown guard — don't spam the same word in the same chat
        if (onCooldown(jid, match.word)) return;

        try {
            await sock.sendMessage(jid, {
                audio:    match.audioBuffer,
                mimetype: match.mimetype,
                ptt:      false,
                contextInfo,
            }, { quoted: message });
        } catch (err) {
            console.error(`[bgm-trigger] send failed (${match.word}):`, err.message);
        }
    },
};

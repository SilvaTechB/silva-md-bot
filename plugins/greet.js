'use strict';

const fs = require('fs');
const path = require('path');
const { fmt } = require('../lib/theme');
const config = require('../config');

const DATA_PATH = path.join(__dirname, '../data/greet.json');

// ── Persistence ───────────────────────────────────────────────────────────────
function loadData() {
    try {
        if (fs.existsSync(DATA_PATH)) {
            return JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
        }
    } catch {
        // Ignore malformed or unavailable persisted data.
    }

    return {};
}

function saveData(data) {
    try {
        const dir = path.dirname(DATA_PATH);

        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        fs.writeFileSync(
            DATA_PATH,
            JSON.stringify(data, null, 2)
        );
    } catch {
        // Ignore persistence errors to avoid breaking message handling.
    }
}

let greetData = loadData();

// ── Once-per-day tracker ──────────────────────────────────────────────────────
// Key: canonical sender JID
// Value: YYYY-MM-DD date of the most recent greeting.
//
// The map is intentionally in memory and resets when the process restarts.
const greetedToday = new Map();

function todayStr() {
    return new Date().toISOString().slice(0, 10);
}

function hasGreetedToday(senderJid) {
    if (!senderJid) return false;

    return greetedToday.get(senderJid) === todayStr();
}

function markGreeted(senderJid) {
    if (!senderJid) return;

    greetedToday.set(senderJid, todayStr());
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function isEnabled() {
    // Enabled by default unless explicitly disabled.
    return greetData.__enabled__ !== false;
}

function getGreetText() {
    const ownerNum = (
        process.env.OWNER_NUMBER ||
        global.botNum ||
        ''
    ).replace(/\D/g, '');

    const ownerJid = ownerNum
        ? `${ownerNum}@s.whatsapp.net`
        : null;

    return (
        greetData.__text__ ||
        (ownerJid && greetData[ownerJid]) ||
        Object.values(greetData).find(
            value => typeof value === 'string'
        ) ||
        null
    );
}

// ── Bootstrap from GREETING env var ──────────────────────────────────────────
// Allows the owner to preconfigure a greeting through environment variables.
// Existing manually configured text takes precedence.
(function bootstrap() {
    const envGreet = (config.GREETING || '').trim();

    if (!envGreet) return;
    if (greetData.__text__) return;

    greetData.__text__ = envGreet;
    saveData(greetData);
})();

// ─────────────────────────────────────────────────────────────────────────────
module.exports = {
    commands: [
        'setgreet',
        'getgreet',
        'delgreet',
        'greeton',
        'greetoff'
    ],

    description:
        'Auto-greeting sent once per day to anyone who DMs the bot',

    permission: 'owner',
    group: false,
    private: true,

    async run(sock, message, args, ctx) {
        const { reply } = ctx;
        const cmd = ctx.command;

        // ── Toggle ON ──────────────────────────────────────────────────────
        if (cmd === 'greeton') {
            greetData.__enabled__ = true;
            saveData(greetData);

            const txt = getGreetText();

            return reply(
                fmt(
                    `✅ *Greeting enabled!*\n\n` +
                    (
                        txt
                            ? `📝 Current message:\n_"${txt}"_`
                            : (
                                `⚠️ No greeting text set yet.\n` +
                                `Use \`.setgreet <message>\` to set one.`
                            )
                    )
                )
            );
        }

        // ── Toggle OFF ─────────────────────────────────────────────────────
        if (cmd === 'greetoff') {
            greetData.__enabled__ = false;
            saveData(greetData);

            return reply(
                fmt(
                    `❌ *Greeting disabled.*\n\n` +
                    `People who message the bot will not receive an auto-reply.`
                )
            );
        }

        // ── Set greeting text ──────────────────────────────────────────────
        if (cmd === 'setgreet') {
            const text = args.join(' ').trim();

            if (!text) {
                return reply(
                    fmt(
                        `📝 *Usage:* \`.setgreet <message>\`\n\n` +
                        `_Example:_\n` +
                        `\`.setgreet Hey! I'm busy right now, I'll reply soon 😊\`\n\n` +
                        `*Tip:* You can also set \`GREETING=\` in your ` +
                        `Replit Secrets to pre-load a greeting automatically.`
                    )
                );
            }

            greetData.__text__ = text;

            // Setting greeting text automatically enables greeting unless the
            // owner explicitly disabled it.
            if (greetData.__enabled__ !== false) {
                greetData.__enabled__ = true;
            }

            saveData(greetData);

            // Allow the updated greeting to be sent again immediately.
            greetedToday.clear();

            return reply(
                fmt(
                    `✅ *Greeting set!*\n\n` +
                    `_"${text}"_\n\n` +
                    `People who DM the bot will receive this *once per day*.\n` +
                    `Use \`.greetoff\` to pause it anytime.`
                )
            );
        }

        // ── View current greeting ──────────────────────────────────────────
        if (cmd === 'getgreet') {
            const txt = getGreetText();
            const on = isEnabled();

            if (!txt) {
                return reply(
                    fmt(
                        `❌ No greeting set.\n\n` +
                        `Use \`.setgreet <message>\` to set one.`
                    )
                );
            }

            return reply(
                fmt(
                    `📝 *Current Greeting*\n\n` +
                    `_"${txt}"_\n\n` +
                    `Status: ${
                        on
                            ? '✅ *ON* — sent once per day'
                            : '❌ *OFF* — paused'
                    }\n\n` +
                    `• \`.greeton\` / \`.greetoff\` — toggle\n` +
                    `• \`.setgreet <msg>\` — change message\n` +
                    `• \`.delgreet\` — delete`
                )
            );
        }

        // ── Delete greeting ────────────────────────────────────────────────
        if (cmd === 'delgreet') {
            const txt = getGreetText();

            if (!txt) {
                return reply(
                    fmt('❌ No greeting to delete.')
                );
            }

            delete greetData.__text__;

            // Remove legacy owner-JID keyed greeting entries.
            Object.keys(greetData).forEach(key => {
                if (
                    key !== '__enabled__' &&
                    key !== '__text__'
                ) {
                    delete greetData[key];
                }
            });

            saveData(greetData);
            greetedToday.clear();

            return reply(
                fmt('✅ Greeting *deleted*.')
            );
        }
    },

    // ── onMessage hook ────────────────────────────────────────────────────────
    // Fires for every incoming private message.
    onMessage: async (
        sock,
        message,
        text,
        {
            jid,
            resolvedFrom,
            isGroup
        }
    ) => {
        if (isGroup) return;
        if (message.key.fromMe) return;
        if (!isEnabled()) return;

        /*
         * `jid` is the destination chat used when sending the response.
         *
         * `resolvedFrom` is the canonical participant identity exposed by
         * handler.js. It may map an incoming @lid identity to the corresponding
         * @s.whatsapp.net JID.
         *
         * Use the canonical identity for once-per-day tracking, but continue
         * sending the response to the original chat JID.
         */
        const canonicalSender = resolvedFrom || jid;

        if (hasGreetedToday(canonicalSender)) return;

        const greet = getGreetText();

        if (!greet) return;

        try {
            await sock.sendMessage(
                jid,
                { text: greet },
                { quoted: message }
            );

            markGreeted(canonicalSender);
        } catch {
            // Greeting failure must not interrupt normal message processing.
        }
    }
};
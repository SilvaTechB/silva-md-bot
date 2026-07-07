'use strict';

const fs     = require('fs');
const path   = require('path');
const { fmt } = require('../lib/theme');
const config  = require('../config');

const DATA_PATH = path.join(__dirname, '../data/greet.json');

// ── Persistence ───────────────────────────────────────────────────────────────
function loadData() {
    try {
        if (fs.existsSync(DATA_PATH)) return JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
    } catch { /* ignore */ }
    return {};
}

function saveData(data) {
    try {
        const dir = path.dirname(DATA_PATH);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
    } catch { /* ignore */ }
}

let greetData = loadData();

// ── Once-per-day tracker (in-memory, resets on bot restart / midnight) ────────
// Key: senderJid  →  Value: 'YYYY-MM-DD' string of the last date greeted.
const greetedToday = new Map();

function todayStr() {
    return new Date().toISOString().slice(0, 10); // e.g. '2026-03-12'
}

function hasGreetedToday(jid) {
    return greetedToday.get(jid) === todayStr();
}

function markGreeted(jid) {
    greetedToday.set(jid, todayStr());
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function isEnabled() {
    // Default ON — becomes OFF only if explicitly set false
    return greetData['__enabled__'] !== false;
}

function getGreetText() {
    const ownerNum = (process.env.OWNER_NUMBER || global.botNum || '').replace(/\D/g, '');
    const ownerJid = ownerNum ? `${ownerNum}@s.whatsapp.net` : null;
    return (
        greetData['__text__'] ||
        (ownerJid && greetData[ownerJid]) ||
        Object.values(greetData).find(v => typeof v === 'string') ||
        null
    );
}

// ── Bootstrap from GREETING env var ──────────────────────────────────────────
// Lets the owner pre-set a greeting via GREETING= in secrets/config without
// ever running .setgreet. Skipped if owner has already set one manually.
(function bootstrap() {
    const envGreet = (config.GREETING || '').trim();
    if (!envGreet) return;
    if (!greetData['__text__']) {
        greetData['__text__'] = envGreet;
        saveData(greetData);
    }
})();

// ─────────────────────────────────────────────────────────────────────────────
module.exports = {
    commands:    ['setgreet', 'getgreet', 'delgreet', 'greeton', 'greetoff'],
    description: 'Auto-greeting sent once per day to anyone who DMs the bot',
    permission:  'owner',
    group:       false,
    private:     true,

    async run(sock, message, args, ctx) {
        const { reply } = ctx;
        const cmd = ctx.command;

        // ── Toggle ON ──────────────────────────────────────────────────────
        if (cmd === 'greeton') {
            greetData['__enabled__'] = true;
            saveData(greetData);
            const txt = getGreetText();
            return reply(fmt(
                `✅ *Greeting enabled!*\n\n` +
                (txt
                    ? `📝 Current message:\n_"${txt}"_`
                    : `⚠️ No greeting text set yet.\nUse \`.setgreet <message>\` to set one.`)
            ));
        }

        // ── Toggle OFF ─────────────────────────────────────────────────────
        if (cmd === 'greetoff') {
            greetData['__enabled__'] = false;
            saveData(greetData);
            return reply(fmt('❌ *Greeting disabled.*\n\nPeople who message the bot will not receive an auto-reply.'));
        }

        // ── Set greeting text ──────────────────────────────────────────────
        if (cmd === 'setgreet') {
            const text = args.join(' ').trim();
            if (!text) {
                return reply(fmt(
                    `📝 *Usage:* \`.setgreet <message>\`\n\n` +
                    `_Example:_\n\`.setgreet Hey! I'm busy right now, I'll reply soon 😊\`\n\n` +
                    `*Tip:* You can also set \`GREETING=\` in your Replit Secrets to pre-load a greeting automatically.`
                ));
            }
            greetData['__text__'] = text;
            // Greeting is auto-enabled when text is set
            if (greetData['__enabled__'] !== false) greetData['__enabled__'] = true;
            saveData(greetData);
            // Clear today's cache so updated greeting goes out fresh
            greetedToday.clear();
            return reply(fmt(
                `✅ *Greeting set!*\n\n_"${text}"_\n\n` +
                `People who DM the bot will receive this *once per day*.\n` +
                `Use \`.greetoff\` to pause it anytime.`
            ));
        }

        // ── View current greeting ──────────────────────────────────────────
        if (cmd === 'getgreet') {
            const txt = getGreetText();
            const on  = isEnabled();
            if (!txt) {
                return reply(fmt('❌ No greeting set.\n\nUse `.setgreet <message>` to set one.'));
            }
            return reply(fmt(
                `📝 *Current Greeting*\n\n` +
                `_"${txt}"_\n\n` +
                `Status: ${on ? '✅ *ON* — sent once per day' : '❌ *OFF* — paused'}\n\n` +
                `• \`.greeton\` / \`.greetoff\` — toggle\n` +
                `• \`.setgreet <msg>\` — change message\n` +
                `• \`.delgreet\` — delete`
            ));
        }

        // ── Delete greeting ────────────────────────────────────────────────
        if (cmd === 'delgreet') {
            const txt = getGreetText();
            if (!txt) return reply(fmt('❌ No greeting to delete.'));
            delete greetData['__text__'];
            // Also remove any legacy owner-JID keyed entries
            Object.keys(greetData).forEach(k => {
                if (k !== '__enabled__' && k !== '__text__') delete greetData[k];
            });
            saveData(greetData);
            greetedToday.clear();
            return reply(fmt('✅ Greeting *deleted*.'));
        }
    },

    // ── onMessage hook — fires for every incoming private message ─────────────
    onMessage: async (sock, message, text, { jid, isGroup }) => {
        if (isGroup) return;
        if (message.key.fromMe) return;

        // Respect the on/off toggle
        if (!isEnabled()) return;

        // Only greet each person once per calendar day
        if (hasGreetedToday(jid)) return;

        const greet = getGreetText();
        if (!greet) return;

        try {
            await sock.sendMessage(jid, { text: greet }, { quoted: message });
            markGreeted(jid);
        } catch { /* ignore */ }
    }
};

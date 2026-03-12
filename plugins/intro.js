'use strict';
const fs   = require('fs');
const path = require('path');
const { fmt } = require('../lib/theme');

const DATA_FILE = path.join(__dirname, '../data/intros.json');

function load() {
    try { return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); } catch { return {}; }
}
function save(data) {
    fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

module.exports = {
    commands:    ['intro', 'setintro', 'myintro', 'delintro', 'introlist'],
    description: 'Personal introduction cards — set, view and share user intros',
    usage:       '.setintro [text] | .intro @mention | .myintro | .delintro',
    permission:  'public',
    group:       true,
    private:     true,

    run: async (sock, message, args, ctx) => {
        const { jid, from, contextInfo } = ctx;
        const intros = load();

        const rawCmd = (
            message.message?.extendedTextMessage?.text ||
            message.message?.conversation || ''
        ).trim().split(/\s+/)[0].replace(/^\./, '').toLowerCase();

        const reply = (text) => sock.sendMessage(jid, { text: fmt(text), contextInfo }, { quoted: message });

        // ── .setintro ──────────────────────────────────────────────────────────
        if (rawCmd === 'setintro') {
            const text = args.join(' ').trim();
            if (!text) return reply('❌ *Usage:* `.setintro [your introduction text]`\n\nExample:\n`.setintro 👋 Hey! I am Silva, a bot developer from Kenya 🇰🇪`');
            if (text.length > 500) return reply('❌ Intro too long — max 500 characters.');
            intros[from] = { text, set: Date.now() };
            save(intros);
            return reply(`✅ *Intro Set!*\n\n${text}\n\n_Use_ \`.myintro\` _to view it._`);
        }

        // ── .delintro ──────────────────────────────────────────────────────────
        if (rawCmd === 'delintro') {
            if (!intros[from]) return reply('❌ You have no intro set.');
            delete intros[from];
            save(intros);
            return reply('🗑️ *Intro deleted.*');
        }

        // ── .myintro ───────────────────────────────────────────────────────────
        if (rawCmd === 'myintro') {
            const mine = intros[from];
            if (!mine) return reply('📭 You have no intro set.\n\n_Use_ `.setintro [text]` _to create one._');
            const num  = from.split('@')[0];
            const date = new Date(mine.set).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
            return reply(`📋 *My Intro*\n👤 +${num}\n📅 Set: ${date}\n\n${mine.text}`);
        }

        // ── .introlist ─────────────────────────────────────────────────────────
        if (rawCmd === 'introlist') {
            const keys = Object.keys(intros);
            if (keys.length === 0) return reply('📭 No intros have been set yet.');
            const lines = keys.map((k, i) => `${i + 1}. +${k.split('@')[0]}`).join('\n');
            return reply(`📋 *Intro List (${keys.length})*\n\n${lines}\n\n_Use_ \`.intro @mention\` _to view someone's intro._`);
        }

        // ── .intro @mention or .intro (no args = own intro) ───────────────────
        const mentioned = message.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0]
                       || (args[0]?.includes('@') ? args[0].replace('@', '') + '@s.whatsapp.net' : null)
                       || (args[0]?.match(/^\d+$/) ? args[0] + '@s.whatsapp.net' : null);

        const target = mentioned || from;
        const entry  = intros[target];
        const num    = target.split('@')[0];

        if (!entry) {
            if (target === from) return reply('📭 You have no intro set.\n\n_Use_ `.setintro [text]` _to create one._');
            return reply(`📭 *+${num}* has not set an intro yet.`);
        }

        const date = new Date(entry.set).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
        return reply(`📋 *Introduction*\n👤 +${num}\n📅 Set: ${date}\n\n${entry.text}`);
    }
};

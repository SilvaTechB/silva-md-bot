'use strict';

const fs   = require('fs');
const path = require('path');
const { fmt, getStr } = require('../lib/theme');
const config = require('../config');

const DATA_PATH = path.join(__dirname, '../data/greet.json');

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

// ── Bootstrap from GREETING env var ─────────────────────────────────────────
// If the owner set GREETING= in their config/env, pre-load it as the default
// greeting so it works immediately without needing .setgreet at all.
(function bootstrapEnvGreeting() {
    const envGreet = (config.GREETING || '').trim();
    if (!envGreet) return;

    const ownerNum = (process.env.OWNER_NUMBER || '').replace(/\D/g, '');
    if (!ownerNum) return;

    const ownerJid = `${ownerNum}@s.whatsapp.net`;

    // Only write if the owner hasn't already overridden it via .setgreet
    if (!greetData[ownerJid]) {
        greetData[ownerJid] = envGreet;
        saveData(greetData);
    }
})();

module.exports = {
    commands:    ['setgreet', 'getgreet', 'delgreet'],
    description: 'Set/get/delete the auto-greeting sent to anyone who messages the bot privately',
    permission:  'owner',
    group:       false,
    private:     true,

    async run(sock, message, args, ctx) {
        const { reply, sender } = ctx;
        const cmd = ctx.command;

        if (cmd === 'setgreet') {
            const text = args.join(' ').trim();
            if (!text) {
                return reply(fmt(
                    `📝 *Usage:* \`.setgreet <message>\`\n\n` +
                    `_Example:_\n\`.setgreet Hey! I'm busy. I'll reply soon 😊\`\n\n` +
                    `You can also set *GREETING=* in your config file to pre-load a greeting without this command.`
                ));
            }
            greetData[sender] = text;
            saveData(greetData);
            return reply(fmt(`✅ Greeting *set!*\n\n_"${text}"_\n\nEveryone who messages the bot privately will receive this.`));
        }

        if (cmd === 'getgreet') {
            const msg = greetData[sender];
            if (!msg) {
                return reply(fmt('❌ No greeting set.\n\nUse `.setgreet <message>` to set one, or add `GREETING=` to your config.'));
            }
            return reply(fmt(`📝 *Current greeting:*\n\n_"${msg}"_`));
        }

        if (cmd === 'delgreet') {
            if (!greetData[sender]) {
                return reply(fmt('❌ No greeting to delete.'));
            }
            delete greetData[sender];
            saveData(greetData);
            return reply(fmt('✅ Greeting *deleted*. People who message the bot will no longer receive an auto-reply.'));
        }
    },

    onMessage: async (sock, message, text, { jid, isGroup }) => {
        if (isGroup) return;
        if (message.key.fromMe) return;

        // The greeting is stored under the bot-owner's JID.
        // jid in private chat = the stranger who sent the message to the bot.
        const ownerNum = (process.env.OWNER_NUMBER || global.botNum || '').replace(/\D/g, '');
        const ownerJid = ownerNum ? `${ownerNum}@s.whatsapp.net` : null;

        const greet =
            (ownerJid && greetData[ownerJid]) ||
            Object.values(greetData)[0] ||
            null;

        if (!greet) return;

        try {
            await sock.sendMessage(jid, { text: greet }, { quoted: message });
        } catch { /* ignore */ }
    }
};

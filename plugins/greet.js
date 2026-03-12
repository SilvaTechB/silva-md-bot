'use strict';

const fs   = require('fs');
const path = require('path');
const { getStr } = require('../lib/theme');

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

module.exports = {
    commands:    ['setgreet', 'getgreet', 'delgreet'],
    description: 'Set/get/delete a personal auto-greeting the bot sends when someone messages you',
    permission:  'public',
    group:       false,
    private:     true,

    async run(sock, message, args, ctx) {
        const { reply, sender } = ctx;
        const botName = getStr('botName') || 'Silva MD';
        const footer  = getStr('footer')  || '';
        const cmd     = ctx.command;

        if (cmd === 'setgreet') {
            const text = args.join(' ').trim();
            if (!text) {
                return reply(
                    `*${botName}*\n\n` +
                    `Usage: \`.setgreet <your greeting message>\`\n\n` +
                    `Example:\n\`.setgreet Hey! I'm busy right now. I'll reply when I'm free. 😊\`\n\n` +
                    footer
                );
            }
            greetData[sender] = text;
            saveData(greetData);
            return reply(`*${botName}*\n\n✅ Personal greeting *set*!\n\n_"${text}"_\n\nAnyone who messages you will receive this automatically.\n\n${footer}`);
        }

        if (cmd === 'getgreet') {
            const msg = greetData[sender];
            if (!msg) {
                return reply(`*${botName}*\n\n❌ No greeting set.\n\nUse \`.setgreet <message>\` to set one.\n\n${footer}`);
            }
            return reply(`*${botName}*\n\n📝 *Your current greeting:*\n\n_"${msg}"_\n\n${footer}`);
        }

        if (cmd === 'delgreet') {
            if (!greetData[sender]) {
                return reply(`*${botName}*\n\n❌ You have no greeting to delete.\n\n${footer}`);
            }
            delete greetData[sender];
            saveData(greetData);
            return reply(`*${botName}*\n\n✅ Personal greeting *deleted*.\n\n${footer}`);
        }
    },

    onMessage: async (sock, message, text, { jid, sender, isGroup }) => {
        if (isGroup) return;
        if (message.key.fromMe) return;

        const greet = greetData[jid];
        if (!greet) return;

        const senderJid = message.key.remoteJid;
        if (senderJid === jid) return;

        try {
            await sock.sendMessage(senderJid, { text: greet }, { quoted: message });
        } catch { /* ignore */ }
    }
};

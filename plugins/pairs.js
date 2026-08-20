'use strict';
const fs   = require('fs');
const path = require('path');

const pairsFile = path.join(__dirname, '..', 'data', 'pairs.json');
function loadPairs() { try { return JSON.parse(fs.readFileSync(pairsFile, 'utf8')); } catch { return {}; } }
function savePairs(d) { fs.mkdirSync(path.dirname(pairsFile), { recursive: true }); fs.writeFileSync(pairsFile, JSON.stringify(d, null, 2)); }

module.exports = {
    commands:    ['pair', 'marry', 'divorce'],
    description: 'Pair/marry two users in a group',
    permission:  'public',
    group:       true,
    private:     false,
    run: async (sock, message, args, { from, jid, prefix, contextInfo, mentionedJid }) => {
        const cmd   = message.body?.split(' ')[0]?.replace(prefix, '').toLowerCase();
        const mentions = mentionedJid?.length
            ? mentionedJid
            : (message.message?.extendedTextMessage?.contextInfo?.mentionedJid || []);
        const pairs   = loadPairs();
        const chatKey = jid;

        if (cmd === 'divorce') {
            const key = Object.keys(pairs[chatKey] || {}).find(k => k.includes(from));
            if (!key) return sock.sendMessage(jid, { text: '❌ You are not paired with anyone.', contextInfo }, { quoted: message });
            delete pairs[chatKey][key];
            savePairs(pairs);
            return sock.sendMessage(jid, { text: '💔 Divorce processed. You are now single.', contextInfo }, { quoted: message });
        }

        const p1 = mentions[0] || from;
        const p2 = mentions[1];
        if (!p2) {
            return sock.sendMessage(jid, { text: '💕 Mention two people to pair them!\nExample: .pair @person1 @person2', contextInfo }, { quoted: message });
        }
        if (!pairs[chatKey]) pairs[chatKey] = {};
        const alreadyPaired = Object.keys(pairs[chatKey]).find(k => k.includes(p1) || k.includes(p2));
        if (alreadyPaired) return sock.sendMessage(jid, { text: '❌ One of them is already paired! Use .divorce first.', contextInfo }, { quoted: message });

        const pairKey = [p1, p2].sort().join('::');
        pairs[chatKey][pairKey] = { since: new Date().toISOString() };
        savePairs(pairs);

        const n1 = p1.split('@')[0];
        const n2 = p2.split('@')[0];
        await sock.sendMessage(jid, {
            text: `💍 *Congratulations!*\n\n💕 @${n1} and @${n2} are now paired!\n\n_May your bond last forever 💖_`,
            mentions: [p1, p2],
            contextInfo
        }, { quoted: message });
    }
};

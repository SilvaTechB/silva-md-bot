'use strict';

const fs   = require('fs');
const path = require('path');
const { fmt, getStr } = require('../lib/theme');
const config = require('../config');

const DATA_PATH  = path.join(__dirname, '../data/warns.json');
const WARN_LIMIT = Math.max(1, Number(config.WARN || process.env.WARN_LIMIT || 3));

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

let warnData = loadData();

function warnKey(jid, user) {
    return `${jid}::${user}`;
}

function getWarnCount(jid, user) {
    return warnData[warnKey(jid, user)] || 0;
}

function addWarn(jid, user) {
    const key = warnKey(jid, user);
    warnData[key] = (warnData[key] || 0) + 1;
    saveData(warnData);
    return warnData[key];
}

function resetWarns(jid, user) {
    delete warnData[warnKey(jid, user)];
    saveData(warnData);
}

function getAllWarns(jid) {
    const prefix = `${jid}::`;
    return Object.entries(warnData)
        .filter(([k]) => k.startsWith(prefix))
        .map(([k, v]) => ({ user: k.slice(prefix.length), count: v }));
}

module.exports = {
    commands:    ['warn', 'unwarn', 'warnreset', 'resetwarn', 'warnlist', 'warnmenu', 'warnings', 'reset'],
    description: 'Warn group members, review warnings, and reset warning counts.',
    usage:       '.warn @user [reason] | .warnlist | .unwarn @user | .warnmenu',
    permission:  'admin',
    group:       true,
    private:     false,
    botAdmin:    true,

    async run(sock, message, args, ctx) {
        const { jid, isAdmin, isBotAdmin, mentionedJid, reply, command, theme } = ctx;

        if (!isAdmin) return reply(fmt(theme.admin || '⛔ Only admins can use this command.'));

        const rawCmd = (message.message?.extendedTextMessage?.text ||
                        message.message?.conversation || '')
            .trim().split(/\s+/)[0].replace(/^\./, '').toLowerCase();

        const quotedParticipant = message.message?.extendedTextMessage?.contextInfo?.participant;
        const target = quotedParticipant || mentionedJid?.[0];
        const sub = (args[0] || '').toLowerCase();

        if (rawCmd === 'warnmenu' || rawCmd === 'warnings') {
            return reply(fmt(
                `⚠️ *Warning Management*\n\n` +
                `• [1m${ctx.prefix || '.'}warn @user [reason][0m — issue a warning\n` +
                `• [1m${ctx.prefix || '.'}warnlist[0m — list warnings\n` +
                `• [1m${ctx.prefix || '.'}unwarn @user[0m — reset a user\n` +
                `• [1m${ctx.prefix || '.'}warnreset @user[0m — reset a user\n` +
                `• [1m${ctx.prefix || '.'}reset warn @user[0m — reset a user\n\n` +
                `_${WARN_LIMIT} warnings trigger automatic removal when I am an admin._`
            ).replace(/\u001b\[1m|\u001b\[0m/g, '*'));
        }

        if (rawCmd === 'warnlist') {
            const warns = getAllWarns(jid);
            if (!warns.length) return reply(fmt('📋 No warnings in this group.'));
            const lines = warns
                .map(w => `• @${w.user.split('@')[0]} — ${w.count}/${WARN_LIMIT} warns`)
                .join('\n');
            const mentions = warns.map(w => w.user);
            return sock.sendMessage(jid, {
                text: fmt(`📋 *Warn List*\n\n${lines}`),
                mentions
            }, { quoted: message });
        }

        if (rawCmd === 'unwarn' || rawCmd === 'warnreset' || rawCmd === 'resetwarn' || (rawCmd === 'reset' && sub === 'warn')) {
            if (!target) return reply(fmt('❌ Reply to a message or mention a user to reset their warnings.'));
            resetWarns(jid, target);
            const num = target.split('@')[0];
            return sock.sendMessage(jid, {
                text: fmt(`✅ Warnings for @${num} have been *reset*.`),
                mentions: [target]
            }, { quoted: message });
        }

        if (!target) {
            return reply(fmt(
                `*Warn System*\n\n` +
                `• ${ctx.prefix || '.'}warn @user [reason] — warn a user (auto-kick after ${WARN_LIMIT})\n` +
                `• ${ctx.prefix || '.'}unwarn @user — remove all warnings\n` +
                `• ${ctx.prefix || '.'}warnlist — list all warned users\n` +
                `• ${ctx.prefix || '.'}warnmenu — show warning help`
            ));
        }

        const quotedText = message.message?.extendedTextMessage?.contextInfo?.quotedMessage?.conversation
            || message.message?.extendedTextMessage?.contextInfo?.quotedMessage?.extendedTextMessage?.text || '';
        const reason = args.filter(a => a !== 'warn' && !a.includes('@')).join(' ')
            || (quotedText && quotedText.length <= 120 ? quotedText : '')
            || 'No reason given';
        const count  = addWarn(jid, target);
        const remaining = WARN_LIMIT - count;
        const num = target.split('@')[0];

        if (count >= WARN_LIMIT) {
            await sock.sendMessage(jid, {
                text: fmt(
                    `⚠️ @${num} has received their *final warning* and has been *removed* from the group.\n\n` +
                    `📝 *Reason:* ${reason}\n` +
                    `⚠️ *Warnings:* ${count}/${WARN_LIMIT}`
                ),
                mentions: [target]
            }, { quoted: message });
            try {
                await sock.groupParticipantsUpdate(jid, [target], 'remove');
            } catch { /* ignore */ }
            resetWarns(jid, target);
            return;
        }

        await sock.sendMessage(jid, {
            text: fmt(
                `⚠️ *Warning Issued*\n\n` +
                `👤 *User:* @${num}\n` +
                `📝 *Reason:* ${reason}\n` +
                `🔢 *Warns:* ${count}/${WARN_LIMIT}\n` +
                `${remaining > 0 ? `⚡ _${remaining} more warning${remaining > 1 ? 's' : ''} before kick._` : ''}`
            ),
            mentions: [target]
        }, { quoted: message });
    }
};

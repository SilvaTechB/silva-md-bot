'use strict';

const fs   = require('fs');
const path = require('path');
const { fmt } = require('../lib/theme');
const { resolvePhoneJid } = require('../lib/phone-utils');

// ─── Persistent storage ───────────────────────────────────────────────────────
const DATA_PATH = path.join(__dirname, '../data/bans.json');

function loadBans() {
    try {
        if (fs.existsSync(DATA_PATH)) {
            const arr = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
            if (Array.isArray(arr)) return new Set(arr);
        }
    } catch { /* ignore */ }
    return new Set();
}

function saveBans() {
    try {
        const dir = path.dirname(DATA_PATH);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(DATA_PATH, JSON.stringify([...global.bannedUsers]));
    } catch { /* ignore */ }
}

// Boot-load into global so handler.js ban check keeps working
if (!global.bannedUsers || global.bannedUsers.size === 0) {
    global.bannedUsers = loadBans();
}

module.exports = {
    commands:    ['ban', 'unban', 'banlist'],
    description: 'Permanently ban / unban users from using bot commands (persisted across restarts)',
    usage:       '.ban @user | .unban @user | .banlist',
    permission:  'admin',
    group:       true,
    private:     true,

    run: async (sock, message, args, ctx) => {
        const { jid, isOwner, isAdmin, contextInfo, mentionedJid } = ctx;

        if (!isAdmin && !isOwner) {
            return sock.sendMessage(jid, { text: fmt('⛔ Only admins can ban/unban users.'), contextInfo }, { quoted: message });
        }

        const rawCmd = (
            message.message?.extendedTextMessage?.text ||
            message.message?.conversation || ''
        ).trim().split(/\s+/)[0].replace(/^\./, '').toLowerCase();

        // ── banlist ────────────────────────────────────────────────────────
        if (rawCmd === 'banlist') {
            if (!global.bannedUsers.size) {
                return sock.sendMessage(jid, {
                    text: fmt('📋 *Ban List*\n\nNo users are currently banned.'),
                    contextInfo
                }, { quoted: message });
            }
            const list     = [...global.bannedUsers].map(j => `• @${j.split('@')[0]}`).join('\n');
            const mentions = [...global.bannedUsers];
            return sock.sendMessage(jid, {
                text: fmt(`📋 *Banned Users (${global.bannedUsers.size})*\n\n${list}\n\n_Bans are permanent and survive restarts._`),
                mentions,
                contextInfo
            }, { quoted: message });
        }

        // ── Collect targets ────────────────────────────────────────────────
        const targets = [];

        const quotedRaw = message.message?.extendedTextMessage?.contextInfo?.participant
                       || message.message?.extendedTextMessage?.contextInfo?.remoteJid;
        if (quotedRaw) {
            const resolved = resolvePhoneJid(quotedRaw) || quotedRaw;
            if (!targets.includes(resolved)) targets.push(resolved);
        }
        if (mentionedJid?.length) {
            mentionedJid.forEach(j => {
                const resolved = resolvePhoneJid(j) || j;
                if (!targets.includes(resolved)) targets.push(resolved);
            });
        }
        // Phone number arg: .ban 2547XXXXXXXX
        if (!targets.length && args[0]) {
            const digits = args[0].replace(/\D/g, '');
            if (digits.length >= 7) targets.push(`${digits}@s.whatsapp.net`);
        }

        if (!targets.length) {
            const action = rawCmd === 'ban' ? 'ban' : 'unban';
            return sock.sendMessage(jid, {
                text: fmt(`❌ Reply to or mention someone to ${action} them.\n\nUsage: \`.${action} @user\``),
                contextInfo
            }, { quoted: message });
        }

        // ── ban ────────────────────────────────────────────────────────────
        if (rawCmd === 'ban') {
            const ownerNum = (process.env.OWNER_NUMBER || global.botNum || '').replace(/\D/g, '');
            const toBan = targets.filter(t => {
                const tNum = t.split('@')[0].replace(/\D/g, '');
                return tNum !== ownerNum;
            });

            if (!toBan.length) {
                return sock.sendMessage(jid, { text: fmt('⛔ Cannot ban the bot owner.'), contextInfo }, { quoted: message });
            }

            toBan.forEach(t => global.bannedUsers.add(t));
            saveBans();

            const names = toBan.map(j => `@${j.split('@')[0]}`).join(', ');
            return sock.sendMessage(jid, {
                text: fmt(`🔨 *Banned:* ${names}\n\nThey can no longer use bot commands.\n_Ban is permanent and survives restarts._`),
                mentions: toBan,
                contextInfo
            }, { quoted: message });
        }

        // ── unban ──────────────────────────────────────────────────────────
        if (rawCmd === 'unban') {
            const wasKnown = targets.filter(t => global.bannedUsers.has(t));
            targets.forEach(t => global.bannedUsers.delete(t));

            if (!wasKnown.length) {
                return sock.sendMessage(jid, {
                    text: fmt('⚠️ None of the mentioned users are currently banned.'),
                    contextInfo
                }, { quoted: message });
            }

            saveBans();

            const names = wasKnown.map(j => `@${j.split('@')[0]}`).join(', ');
            return sock.sendMessage(jid, {
                text: fmt(`✅ *Unbanned:* ${names}\n\nThey can use bot commands again.`),
                mentions: wasKnown,
                contextInfo
            }, { quoted: message });
        }
    }
};

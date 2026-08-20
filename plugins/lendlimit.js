'use strict';

/**
 * plugins/lendlimit.js
 * Owner tools:
 *  .lendlimit <n>   — set max simultaneous sub-bots (0 = unlimited)
 *  .lendexpiry <n>d|h — set default lend expiry (e.g. 7d, 24h, 0 = forever)
 *  .lendstats       — show lend health dashboard
 *  .expirelends     — owner manually triggers expiry check now
 */

const fs   = require('fs');
const path = require('path');
const { fmt } = require('../lib/theme');
const { stopSubBot, wipeSubBotSession } = require('../lib/subbot');

const SETTINGS_PATH = path.join(__dirname, '../data/lend-settings.json');
const LENDS_PATH    = path.join(__dirname, '../data/lends.json');

function loadSettings() {
    try { return JSON.parse(fs.readFileSync(SETTINGS_PATH, 'utf8')); } catch { return { maxSubBots: 0, defaultExpiryMs: 0 }; }
}
function saveSettings(s) {
    try { fs.mkdirSync(path.dirname(SETTINGS_PATH), { recursive: true }); fs.writeFileSync(SETTINGS_PATH, JSON.stringify(s, null, 2)); } catch { /* ignore */ }
}
function loadLends() {
    try { return JSON.parse(fs.readFileSync(LENDS_PATH, 'utf8')); } catch { return { pending: {}, approved: {}, rejected: {} }; }
}
function saveLends(db) {
    try { fs.mkdirSync(path.dirname(LENDS_PATH), { recursive: true }); fs.writeFileSync(LENDS_PATH, JSON.stringify(db, null, 2)); } catch { /* ignore */ }
}

function parseDuration(str) {
    const m = String(str).match(/^(\d+)(d|h|m)$/i);
    if (!m) return null;
    const n = parseInt(m[1], 10);
    const unit = m[2].toLowerCase();
    if (unit === 'd') return n * 86400000;
    if (unit === 'h') return n * 3600000;
    if (unit === 'm') return n * 60000;
    return null;
}

function formatDuration(ms) {
    if (!ms) return 'Never (∞)';
    const d = Math.floor(ms / 86400000);
    const h = Math.floor((ms % 86400000) / 3600000);
    const parts = [];
    if (d) parts.push(`${d}d`);
    if (h) parts.push(`${h}h`);
    return parts.join(' ') || '<1h';
}

// ── Expiry checker (exported so silva.js can schedule it) ─────────────────────
async function checkExpiredLends(sock) {
    const settings = loadSettings();
    if (!settings.defaultExpiryMs) return; // no expiry configured

    const db  = loadLends();
    const now = Date.now();
    let expired = 0;

    for (const [key, record] of Object.entries(db.approved || {})) {
        const expiryMs = record.expiryMs || settings.defaultExpiryMs;
        if (!expiryMs) continue;
        const expiresAt = (record.approvedAt || 0) + expiryMs;
        if (now >= expiresAt) {
            // Stop sub-bot
            try { await stopSubBot(record.targetNumber); } catch { /* ignore */ }
            wipeSubBotSession(record.targetNumber);

            // Notify user
            const rJid = `${record.requestorNum}@s.whatsapp.net`;
            try {
                await sock.sendMessage(rJid, {
                    text: fmt(
                        `⏰ *Lend Expired*\n\n` +
                        `Your sub-bot (+${record.targetNumber}) lend has expired and been automatically stopped.\n\n` +
                        `Contact the bot owner to renew: \`.lend ${record.targetNumber}\``
                    )
                });
            } catch { /* ignore */ }

            // Move to rejected with expired flag
            record.expiredAt = now;
            db.rejected[key] = record;
            delete db.approved[key];
            expired++;
            console.log(`[LendExpiry] Expired sub-bot +${record.targetNumber} for +${record.requestorNum}`);
        }
    }
    if (expired) saveLends(db);
    return expired;
}
global._lendExpiryCheck = checkExpiredLends;

module.exports = {
    commands:    ['lendlimit', 'lendexpiry', 'lendstats', 'expirelends', 'lendconfig'],
    description: 'Configure lend limits, expiry times, and view lend health dashboard',
    usage:       '.lendlimit 5 | .lendexpiry 7d | .lendstats | .expirelends',
    permission:  'owner',
    group:       true,
    private:     true,

    run: async (sock, message, args, ctx) => {
        const { sender, jid, isOwner, contextInfo, reply } = ctx;
        if (!isOwner) return reply(fmt('⛔ Only the owner can manage lend settings.'));

        const rawCmd = (
            message.message?.extendedTextMessage?.text ||
            message.message?.conversation || ''
        ).trim().split(/\s+/)[0].replace(/^\./, '').toLowerCase();

        const settings = loadSettings();
        const db       = loadLends();

        // ── .lendconfig — show current config ────────────────────────────────
        if (rawCmd === 'lendconfig' || (rawCmd === 'lendlimit' && !args.length)) {
            const pending  = Object.keys(db.pending  || {}).length;
            const approved = Object.keys(db.approved || {}).length;
            const running  = global.subBots?.size || 0;
            return reply(fmt(
                `⚙️ *Lend Configuration*\n\n` +
                `🔢 *Max sub-bots:*     ${settings.maxSubBots || '∞ (unlimited)'}\n` +
                `⏰ *Default expiry:*   ${formatDuration(settings.defaultExpiryMs)}\n\n` +
                `📊 *Current Status:*\n` +
                `   Pending requests: ${pending}\n` +
                `   Active lends: ${approved}\n` +
                `   Running sub-bots: ${running}\n\n` +
                `_Commands:_\n` +
                `• \`.lendlimit 5\` — max 5 sub-bots at once\n` +
                `• \`.lendlimit 0\` — unlimited\n` +
                `• \`.lendexpiry 7d\` — lends expire after 7 days\n` +
                `• \`.lendexpiry 0\` — no expiry`
            ));
        }

        // ── .lendlimit <n> ────────────────────────────────────────────────────
        if (rawCmd === 'lendlimit') {
            const n = parseInt(args[0], 10);
            if (isNaN(n) || n < 0) return reply(fmt('⚠️ Usage: `.lendlimit <number>` (0 = unlimited)'));
            settings.maxSubBots = n;
            saveSettings(settings);
            return reply(fmt(`✅ Max simultaneous sub-bots set to *${n === 0 ? '∞ unlimited' : n}*.`));
        }

        // ── .lendexpiry <duration> ────────────────────────────────────────────
        if (rawCmd === 'lendexpiry') {
            if (!args[0]) return reply(fmt('⚠️ Usage: `.lendexpiry 7d` (or 24h, 30d, 0 for no expiry)'));
            if (args[0] === '0') {
                settings.defaultExpiryMs = 0;
                saveSettings(settings);
                return reply(fmt('✅ Default lend expiry removed — lends are now permanent until revoked.'));
            }
            const ms = parseDuration(args[0]);
            if (!ms) return reply(fmt('⚠️ Invalid format. Use `7d`, `24h`, `30d`, etc.'));
            settings.defaultExpiryMs = ms;
            saveSettings(settings);
            return reply(fmt(`✅ Default lend expiry set to *${formatDuration(ms)}*.\n\nAll new lends will expire after this duration.`));
        }

        // ── .lendstats — dashboard ────────────────────────────────────────────
        if (rawCmd === 'lendstats') {
            const approved = Object.values(db.approved || {});
            const pending  = Object.values(db.pending  || {});
            const running  = global.subBots?.size || 0;
            const now      = Date.now();

            const activeLines = approved.map(r => {
                const entry     = global.subBots?.get(r.targetNumber?.replace(/\D/g, ''));
                const status    = entry ? `🟢 ${entry.status}` : '🔴 offline';
                const expiryMs  = r.expiryMs || settings.defaultExpiryMs;
                let expiryStr   = 'never';
                if (expiryMs) {
                    const remaining = ((r.approvedAt || 0) + expiryMs) - now;
                    expiryStr = remaining > 0 ? `${Math.floor(remaining/86400000)}d ${Math.floor((remaining%86400000)/3600000)}h left` : '⚠️ expired';
                }
                return `  📱 *+${r.targetNumber}* → ${r.requestorName}\n     ${status} | expires: ${expiryStr}`;
            });

            const pendingLines = pending.map(r =>
                `  ⏳ *${r.requestorName}* (+${r.requestorNum}) → +${r.targetNumber}`
            );

            return reply(fmt(
                `📊 *Lend Dashboard*\n\n` +
                `🔢 Limit: ${settings.maxSubBots || '∞'}  |  ⏰ Expiry: ${formatDuration(settings.defaultExpiryMs)}\n` +
                `🟢 Running: ${running}  |  ✅ Approved: ${approved.length}  |  ⏳ Pending: ${pending.length}\n\n` +
                (activeLines.length ? `*Active Lends:*\n${activeLines.join('\n')}\n\n` : '') +
                (pendingLines.length ? `*Pending Requests:*\n${pendingLines.join('\n')}` : '') +
                (!activeLines.length && !pendingLines.length ? '_No lends on record._' : '')
            ));
        }

        // ── .expirelends — manual trigger ─────────────────────────────────────
        if (rawCmd === 'expirelends') {
            await reply(fmt('⏳ Running expiry check…'));
            const expired = await checkExpiredLends(sock);
            return reply(fmt(
                expired
                    ? `✅ Expired and stopped *${expired}* sub-bot${expired !== 1 ? 's' : ''}.`
                    : `✅ No expired lends found.`
            ));
        }
    }
};

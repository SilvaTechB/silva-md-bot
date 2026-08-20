'use strict';

const fs   = require('fs');
const path = require('path');
const { fmt } = require('../lib/theme');
const { startSubBot, stopSubBot, wipeSubBotSession, listSubBots, getSubBotDir } = require('../lib/subbot');

const LENDS_PATH = path.join(__dirname, '../data/lends.json');

function loadLends() {
    try { return JSON.parse(fs.readFileSync(LENDS_PATH, 'utf8')); } catch { return { pending: {}, approved: {}, rejected: {} }; }
}
function saveLends(db) {
    try {
        fs.mkdirSync(path.dirname(LENDS_PATH), { recursive: true });
        fs.writeFileSync(LENDS_PATH, JSON.stringify(db, null, 2));
    } catch { /* ignore */ }
}

const STATUS_EMOJI = { connected: '🟢', connecting: '🟡', disconnected: '🔴' };

module.exports = {
    commands:    ['subbot', 'subbots', 'mybotinfo', 'kicksubbot', 'restartsubbot'],
    description: 'Manage active sub-bot instances (lent bot sessions)',
    usage:       '.subbot list | .subbot stop <number> | .subbot restart <number> | .mybotinfo',
    permission:  'owner',
    group:       true,
    private:     true,

    run: async (sock, message, args, ctx) => {
        const { sender, jid, isOwner, contextInfo, reply } = ctx;

        const rawCmd = (
            message.message?.extendedTextMessage?.text ||
            message.message?.conversation || ''
        ).trim().split(/\s+/)[0].replace(/^\./, '').toLowerCase();

        // ── .mybotinfo — any user can check if they have a sub-bot ──────────
        if (rawCmd === 'mybotinfo') {
            const senderNum = sender.split('@')[0].replace(/\D/g, '');
            const db        = loadLends();

            // Find any sub-bot record where this person is the requestor
            const record = db.approved[senderNum] || db.pending[senderNum] || db.rejected[senderNum];
            if (!record) {
                return reply(fmt(
                    `🤖 *Your Sub-bot Status*\n\n` +
                    `You have no sub-bot on record.\n\n` +
                    `To request one: \`.lend 2547XXXXXXXX\`\n` +
                    `_(The number you want to connect)_`
                ));
            }

            const runningEntry = global.subBots.get(record.targetNumber?.replace(/\D/g, ''));
            const liveStatus   = runningEntry
                ? `${STATUS_EMOJI[runningEntry.status] || '⚪'} ${runningEntry.status}`
                : (record.status === 'logged_out' ? '🔴 Logged out' : '⚫ Offline');
            const isApproved   = !!db.approved[senderNum];
            const isPending    = !!db.pending[senderNum];
            const isRejected   = !!db.rejected[senderNum];

            return reply(fmt(
                `🤖 *Your Sub-bot Info*\n\n` +
                `📞 Number: +${record.targetNumber}\n` +
                `📋 Request: ${isApproved ? '✅ Approved' : isPending ? '⏳ Pending' : '❌ Rejected'}\n` +
                (isApproved ? `🔌 Connection: ${liveStatus}\n` : '') +
                `🕐 Requested: ${new Date(record.requestedAt).toLocaleString()}\n` +
                (record.approvedAt ? `✅ Approved: ${new Date(record.approvedAt).toLocaleString()}\n` : '') +
                `\n_Use \`.lend\` for help._`
            ));
        }

        // ── Owner-only commands below ────────────────────────────────────────
        if (!isOwner) return reply(fmt('⛔ Only the owner can manage sub-bots.'));

        const sub    = args[0]?.toLowerCase() || 'list';
        const target = (args[1] || '').replace(/\D/g, '');

        // .subbot list / .subbots
        if (rawCmd === 'subbots' || sub === 'list' || sub === 'ls' || sub === '') {
            const bots = listSubBots();
            const db   = loadLends();
            const approved = Object.values(db.approved || {});

            if (!bots.length && !approved.length) {
                return reply(fmt(`🤖 *Sub-bots*\n\nNo active or approved sub-bots.\n\nApprove a lend with \`.approvelend\`.`));
            }

            const lines = approved.map(rec => {
                const entry = global.subBots.get(rec.targetNumber?.replace(/\D/g, ''));
                const status = entry
                    ? `${STATUS_EMOJI[entry.status] || '⚪'} ${entry.status}`
                    : (rec.status === 'logged_out' ? '🔴 logged out' : '⚫ offline');
                return (
                    `📱 *+${rec.targetNumber}*\n` +
                    `   Owner: ${rec.requestorName} (+${rec.requestorNum})\n` +
                    `   Status: ${status}\n` +
                    `   Since: ${new Date(rec.approvedAt || rec.requestedAt).toLocaleDateString()}`
                );
            });

            return reply(fmt(
                `🤖 *Sub-bot Registry*  (${approved.length} total)\n\n` +
                lines.join('\n\n') +
                `\n\n_Commands:_\n` +
                `• \`.subbot stop <number>\` — stop a sub-bot\n` +
                `• \`.subbot restart <number>\` — restart a sub-bot\n` +
                `• \`.subbot wipe <number>\` — wipe session files`
            ));
        }

        // .subbot stop <number>
        if (sub === 'stop' || rawCmd === 'kicksubbot') {
            const num = target || args.slice(1).join('').replace(/\D/g, '');
            if (!num) return reply(fmt('⚠️ Usage: `.subbot stop 2547XXXXXXXX`'));
            const stopped = await stopSubBot(num);
            if (!stopped) return reply(fmt(`⚠️ No running sub-bot found for +${num}.`));
            return reply(fmt(`🛑 Sub-bot +${num} has been stopped.\n\n_Use \`.subbot restart ${num}\` to bring it back._`));
        }

        // .subbot restart <number>
        if (sub === 'restart' || rawCmd === 'restartsubbot') {
            const num = target || args.slice(1).join('').replace(/\D/g, '');
            if (!num) return reply(fmt('⚠️ Usage: `.subbot restart 2547XXXXXXXX`'));

            const db     = loadLends();
            const record = Object.values(db.approved || {}).find(r => r.targetNumber.replace(/\D/g, '') === num);
            if (!record) return reply(fmt(`⚠️ No approved lend found for +${num}. Cannot restart.`));

            await reply(fmt(`⏳ Restarting sub-bot +${num}…`));
            try {
                await startSubBot({
                    number:       num,
                    requestorJid: record.requestorJid,
                    requestorNum: record.requestorNum,
                    mainSock:     sock,
                });
                return reply(fmt(`♻️ Sub-bot +${num} is reconnecting. The user will receive a DM when it's live.`));
            } catch (e) {
                return reply(fmt(`❌ Restart failed: ${e.message}`));
            }
        }

        // .subbot wipe <number>  — delete session files
        if (sub === 'wipe') {
            const num = target || args.slice(1).join('').replace(/\D/g, '');
            if (!num) return reply(fmt('⚠️ Usage: `.subbot wipe 2547XXXXXXXX`\n\n⚠️ This removes all session files for that sub-bot.'));

            // Stop first if running
            await stopSubBot(num);
            wipeSubBotSession(num);

            // Remove from approved lends so they can re-request
            const db = loadLends();
            const matchKey = Object.keys(db.approved || {}).find(k => {
                const r = db.approved[k];
                return r.targetNumber?.replace(/\D/g, '') === num;
            });
            if (matchKey) {
                delete db.approved[matchKey];
                saveLends(db);
            }
            return reply(fmt(`🗑️ Sub-bot +${num} session wiped and lend record cleared.\nUser can re-request with \`.lend\`.`));
        }

        // .subbot info <number>
        if (sub === 'info') {
            const num   = target || args.slice(1).join('').replace(/\D/g, '');
            const entry = global.subBots.get(num);
            const db    = loadLends();
            const record = Object.values(db.approved || {}).find(r => r.targetNumber?.replace(/\D/g, '') === num);
            if (!entry && !record) return reply(fmt(`⚠️ No sub-bot found for +${num}.`));

            return reply(fmt(
                `📋 *Sub-bot Info: +${num}*\n\n` +
                `Status: ${entry ? `${STATUS_EMOJI[entry.status] || '⚪'} ${entry.status}` : '⚫ offline'}\n` +
                (record ? `Owner: ${record.requestorName} (+${record.requestorNum})\n` : '') +
                (entry ? `Started: ${new Date(entry.startedAt).toLocaleString()}\n` : '') +
                (record?.approvedAt ? `Approved: ${new Date(record.approvedAt).toLocaleString()}\n` : '')
            ));
        }

        return reply(fmt(
            `🤖 *Sub-bot Commands*\n\n` +
            `• \`.subbot list\` — list all sub-bots\n` +
            `• \`.subbot info <number>\` — show sub-bot details\n` +
            `• \`.subbot stop <number>\` — stop a running sub-bot\n` +
            `• \`.subbot restart <number>\` — restart a sub-bot\n` +
            `• \`.subbot wipe <number>\` — wipe session and clear lend record\n` +
            `• \`.subbots\` — quick list\n` +
            `• \`.mybotinfo\` — user checks their own sub-bot status`
        ));
    }
};

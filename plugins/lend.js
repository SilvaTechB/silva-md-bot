'use strict';

const fs    = require('fs');
const path  = require('path');
const axios = require('axios');
const { fmt } = require('../lib/theme');
const { startSubBot, stopSubBot, wipeSubBotSession } = require('../lib/subbot');

const SETTINGS_PATH = path.join(__dirname, '../data/lend-settings.json');

function loadSettings() {
    try { return JSON.parse(fs.readFileSync(SETTINGS_PATH, 'utf8')); } catch { return { maxSubBots: 0, defaultExpiryMs: 0 }; }
}

function parseDuration(str) {
    const m = String(str || '').match(/^(\d+)(d|h|m)$/i);
    if (!m) return null;
    const n = parseInt(m[1], 10);
    const u = m[2].toLowerCase();
    return u === 'd' ? n * 86400000 : u === 'h' ? n * 3600000 : n * 60000;
}

function formatDuration(ms) {
    if (!ms) return '∞ (no expiry)';
    const d = Math.floor(ms / 86400000), h = Math.floor((ms % 86400000) / 3600000);
    return [d && `${d}d`, h && `${h}h`].filter(Boolean).join(' ') || '<1h';
}

const SESSION_SERVER = 'https://session.silvatech.co.ke';
const DATA_PATH      = path.join(__dirname, '../data/lends.json');

// ─── Persistence ──────────────────────────────────────────────────────────────
function load() {
    try {
        if (fs.existsSync(DATA_PATH)) return JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
    } catch { /* ignore */ }
    return { pending: {}, approved: {}, rejected: {} };
}
function save(data) {
    try {
        fs.mkdirSync(path.dirname(DATA_PATH), { recursive: true });
        fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
    } catch { /* ignore */ }
}

// ─── Pair code fetch ──────────────────────────────────────────────────────────
async function fetchPairCode(number) {
    const clean = String(number).replace(/\D/g, '');
    const res = await axios.get(`${SESSION_SERVER}/code`, {
        params:  { number: clean },
        timeout: 15000,
        headers: { 'User-Agent': 'SilvaMD-Bot/2.0' }
    });
    const code = res.data?.code || res.data?.pairCode || res.data?.pair_code;
    if (!code) throw new Error('No code returned');
    return code;
}

// ─── Plugin ───────────────────────────────────────────────────────────────────
module.exports = {
    commands:    ['lend', 'approvelend', 'rejectlend', 'lendlist', 'lendstatus', 'revokelend'],
    description: 'Lend the bot to a user — requests owner approval then delivers a pair code',
    usage:       '.lend 2547XXXXXXXX | (owner) .approvelend 2547XXXXXXXX | .rejectlend 2547XXXXXXXX',
    permission:  'public',
    group:       true,
    private:     true,

    run: async (sock, message, args, ctx) => {
        const { sender, jid, isOwner, contextInfo, reply } = ctx;

        const ownerJid   = `${(process.env.OWNER_NUMBER || global.botNum || '').replace(/\D/g, '')}@s.whatsapp.net`;
        const senderNum  = sender.split('@')[0];
        const pushName   = global.pushNameCache?.get(senderNum)
                        || global.pushNameCache?.get(sender)
                        || 'User';

        const rawCmd = (
            message.message?.extendedTextMessage?.text ||
            message.message?.conversation || ''
        ).trim().split(/\s+/)[0].replace(/^\./, '').toLowerCase();

        let db = load();

        // ── .lendlist — owner only ─────────────────────────────────────────
        if (rawCmd === 'lendlist') {
            if (!isOwner) return reply(fmt('⛔ Only the owner can view the lend list.'));
            const pending  = Object.values(db.pending);
            const approved = Object.values(db.approved);
            if (!pending.length && !approved.length) {
                return reply(fmt('📋 *Lend List*\n\nNo pending or active lend requests.'));
            }
            const pLines = pending.map(r =>
                `⏳ *${r.requestorName}* (+${r.requestorNum}) → +${r.targetNumber}\n   _Requested: ${new Date(r.requestedAt).toLocaleString()}_`
            ).join('\n');
            const aLines = approved.map(r =>
                `✅ *${r.requestorName}* (+${r.requestorNum}) → +${r.targetNumber}\n   _Approved: ${new Date(r.approvedAt).toLocaleString()}_`
            ).join('\n');
            return reply(fmt(
                `📋 *Lend Registry*\n\n` +
                (pLines ? `*Pending (${pending.length}):*\n${pLines}\n\n` : '') +
                (aLines ? `*Active (${approved.length}):*\n${aLines}` : '')
            ));
        }

        // ── .lendstatus — check own request ───────────────────────────────
        if (rawCmd === 'lendstatus') {
            const mine = db.pending[senderNum] || db.approved[senderNum] || db.rejected[senderNum];
            if (!mine) return reply(fmt('ℹ️ You have no lend request on record.\n\nUse `.lend 2547XXXXXXXX` to request.'));
            const status = db.approved[senderNum] ? '✅ Approved'
                         : db.rejected[senderNum] ? '❌ Rejected'
                         : '⏳ Pending owner approval';
            return reply(fmt(
                `🤝 *Your Lend Request*\n\n` +
                `Number requested: +${mine.targetNumber}\n` +
                `Status: *${status}*\n` +
                `Requested: ${new Date(mine.requestedAt).toLocaleString()}`
            ));
        }

        // ── .approvelend — owner only ─────────────────────────────────────
        // Usage: .approvelend <number> [7d|24h|30d]
        if (rawCmd === 'approvelend') {
            if (!isOwner) return reply(fmt('⛔ Only the owner can approve lend requests.'));

            const settings   = loadSettings();
            // Extract optional duration arg (e.g. 7d, 24h)
            const durationArg = args.find(a => /^\d+(d|h|m)$/i.test(a));
            const numArg      = args.filter(a => a !== durationArg).join('').replace(/\D/g, '')
                             || (message.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0]?.split('@')[0]);

            if (!numArg) {
                const pending = Object.values(db.pending);
                if (!pending.length) return reply(fmt('📋 No pending lend requests.'));
                const list = pending.map((r, i) =>
                    `${i+1}. *${r.requestorName}* (+${r.requestorNum}) → for +${r.targetNumber}`
                ).join('\n');
                return reply(fmt(
                    `📋 *Pending Requests:*\n\n${list}\n\n` +
                    `_Use:_ \`.approvelend <number>\`\n` +
                    `_With expiry:_ \`.approvelend <number> 7d\``
                ));
            }

            // ── Sub-bot limit check ──────────────────────────────────────────
            if (settings.maxSubBots > 0) {
                const activeCount = Object.keys(db.approved).length;
                if (activeCount >= settings.maxSubBots) {
                    return reply(fmt(
                        `⛔ *Sub-bot limit reached!*\n\n` +
                        `Current limit: *${settings.maxSubBots}* active lends.\n` +
                        `Active lends: *${activeCount}*\n\n` +
                        `Revoke an existing lend first (\`.revokelend <number>\`)\n` +
                        `or increase the limit with \`.lendlimit <n>\`.`
                    ));
                }
            }

            // Find by requestor number or target number
            let record = db.pending[numArg];
            if (!record) record = Object.values(db.pending).find(r => r.targetNumber === numArg);
            if (!record) return reply(fmt(`⚠️ No pending request found for +${numArg}.`));

            // Resolve expiry
            const expiryMs = durationArg
                ? (parseDuration(durationArg) || settings.defaultExpiryMs)
                : settings.defaultExpiryMs;

            await reply(fmt(`⏳ Approved! Starting sub-bot connection for +${record.targetNumber}…`));

            record.approvedAt = Date.now();
            record.expiryMs   = expiryMs;
            db.approved[record.requestorNum] = record;
            delete db.pending[record.requestorNum];
            save(db);

            const requestorJid = `${record.requestorNum}@s.whatsapp.net`;

            try {
                startSubBot({
                    number:       record.targetNumber,
                    requestorJid: requestorJid,
                    requestorNum: record.requestorNum,
                    mainSock:     sock,
                }).catch(e => {
                    console.error(`[SubBot] startSubBot error for +${record.targetNumber}: ${e.message}`);
                });

                const expiryNote = expiryMs
                    ? `⏰ *Expires in:* ${formatDuration(expiryMs)}`
                    : `⏰ *Expires:* Never (permanent until revoked)`;

                await reply(fmt(
                    `✅ *Approved!*\n\n` +
                    `Sub-bot for *${record.requestorName}* (+${record.requestorNum}) is starting.\n` +
                    `📞 Number: +${record.targetNumber}\n` +
                    `${expiryNote}\n\n` +
                    `A pair code will be sent to the user's DM shortly.\n` +
                    `They must enter it in WhatsApp → Linked Devices within 60 seconds.\n\n` +
                    `_Once linked, the sub-bot goes live automatically._`
                ));

            } catch (err) {
                reply(fmt(`❌ Failed to start sub-bot: ${err.message}`));
            }
            return;
        }

        // ── .rejectlend — owner only ──────────────────────────────────────
        if (rawCmd === 'rejectlend') {
            if (!isOwner) return reply(fmt('⛔ Only the owner can reject lend requests.'));
            const targetNum = args.join('').replace(/\D/g, '');
            let record = db.pending[targetNum]
                      || Object.values(db.pending).find(r => r.targetNumber === targetNum);
            if (!record) return reply(fmt(`⚠️ No pending request found for +${targetNum}.`));

            record.rejectedAt = Date.now();
            db.rejected[record.requestorNum] = record;
            delete db.pending[record.requestorNum];
            save(db);

            // Notify requestor
            const requestorJid = `${record.requestorNum}@s.whatsapp.net`;
            try {
                await sock.sendMessage(requestorJid, {
                    text: fmt(
                        `❌ *Lend Request Rejected*\n\n` +
                        `Your request for +${record.targetNumber} was not approved.\n\n` +
                        `You may contact the bot owner for more information.`
                    )
                });
            } catch { /* ignore if DM fails */ }

            return reply(fmt(`❌ Request from *${record.requestorName}* (+${record.requestorNum}) rejected.`));
        }

        // ── .revokelend — owner only ──────────────────────────────────────
        if (rawCmd === 'revokelend') {
            if (!isOwner) return reply(fmt('⛔ Only the owner can revoke lends.'));
            const targetNum = args.join('').replace(/\D/g, '');

            // Find by requestor num or target number
            const matchKey = targetNum
                ? (db.approved[targetNum]
                    ? targetNum
                    : Object.keys(db.approved).find(k => db.approved[k].targetNumber?.replace(/\D/g, '') === targetNum))
                : null;

            if (!matchKey) return reply(fmt(`⚠️ No active lend found for +${targetNum}.`));

            const record = db.approved[matchKey];

            // Stop the running sub-bot if alive
            try { await stopSubBot(record.targetNumber); } catch { /* ignore */ }

            // Notify the user
            const rJid = `${record.requestorNum}@s.whatsapp.net`;
            try {
                await sock.sendMessage(rJid, {
                    text: fmt(
                        `ℹ️ *Sub-bot Revoked*\n\n` +
                        `Your sub-bot (+${record.targetNumber}) has been revoked by the owner.\n` +
                        `Contact the owner to re-request.`
                    )
                });
            } catch { /* ignore */ }

            delete db.approved[matchKey];
            save(db);
            return reply(fmt(`✅ Lend for +${record.targetNumber} (owned by +${record.requestorNum}) revoked and sub-bot stopped.`));
        }

        // ── .lend — request to lend bot ───────────────────────────────────
        if (rawCmd === 'lend') {
            const rawNumber = args.join('').replace(/\D/g, '');

            if (!rawNumber) {
                return reply(fmt(
                    `🤝 *Bot Lend / Session Request*\n\n` +
                    `Request the owner to generate a WhatsApp pair code so you can connect your own bot instance.\n\n` +
                    `*Usage:*\n` +
                    `\`.lend 2547XXXXXXXX\`\n` +
                    `_(the number you want to connect as a bot)_\n\n` +
                    `*Process:*\n` +
                    `1️⃣ Send \`.lend <your number>\`\n` +
                    `2️⃣ Owner reviews your request\n` +
                    `3️⃣ If approved, bot sends you a pair code\n` +
                    `4️⃣ Enter the code in WhatsApp → Linked Devices\n\n` +
                    `_Use \`.lendstatus\` to check your request._`
                ));
            }

            // Check if already pending or approved
            if (db.pending[senderNum]) {
                return reply(fmt(
                    `⏳ *You already have a pending request.*\n\n` +
                    `For number: +${db.pending[senderNum].targetNumber}\n` +
                    `Waiting for owner approval.\n\n` +
                    `_Use \`.lendstatus\` to check._`
                ));
            }
            if (db.approved[senderNum]) {
                return reply(fmt(
                    `✅ *You already have an approved lend.*\n\n` +
                    `For number: +${db.approved[senderNum].targetNumber}\n\n` +
                    `Contact the owner to get a fresh pair code.`
                ));
            }

            // Create request record
            const record = {
                requestorJid:  sender,
                requestorNum:  senderNum,
                requestorName: pushName,
                targetNumber:  rawNumber,
                requestedAt:   Date.now(),
                chatJid:       jid,
            };
            db.pending[senderNum] = record;
            save(db);

            // Notify owner
            try {
                await sock.sendMessage(ownerJid, {
                    text: fmt(
                        `🤝 *New Bot Lend Request*\n\n` +
                        `👤 *From:* ${pushName} (+${senderNum})\n` +
                        `📞 *For number:* +${rawNumber}\n` +
                        `🕐 *Time:* ${new Date().toLocaleString()}\n\n` +
                        `*Actions:*\n` +
                        `✅ Approve: \`.approvelend ${senderNum}\`\n` +
                        `❌ Reject:  \`.rejectlend ${senderNum}\`\n\n` +
                        `_Use \`.lendlist\` to see all requests._`
                    )
                });
            } catch { /* owner DM may fail silently */ }

            return reply(fmt(
                `✅ *Lend Request Submitted!*\n\n` +
                `📞 Number: +${rawNumber}\n` +
                `⏳ Status: *Pending owner approval*\n\n` +
                `You'll receive a pair code in your DM once approved.\n` +
                `_Use \`.lendstatus\` to track your request._`
            ));
        }
    }
};

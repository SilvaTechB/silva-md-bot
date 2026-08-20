'use strict';

const fs   = require('fs');
const path = require('path');
const { fmt } = require('../lib/theme');

// ─── Scam phrase patterns ─────────────────────────────────────────────────────
// Each entry: { label, patterns: [RegExp] }
const SCAM_CATEGORIES = [
    {
        label: 'Investment Fraud',
        patterns: [
            /double\s+your\s+(money|investment|cash|crypto)/i,
            /\d+[x×%]\s*(profit|return|roi|gains?)\s*(guaranteed|daily|weekly|monthly)?/i,
            /guaranteed\s+(returns?|profits?|income|investment)/i,
            /invest\s+(and|to)\s+(earn|make|get)\s+\d/i,
            /minimum\s+invest(ment)?\s+of?\s+[a-z]*\s*\d/i,
            /withdrawal\s+of\s+[a-z]*\s*\d+\s*(daily|weekly|per day)/i,
            /ponzi|pyramid\s+scheme/i,
            /send\s+(btc|eth|usdt|crypto|coins?|money)\s+(to|and\s+get)/i,
        ]
    },
    {
        label: 'Fake Giveaway / Prize',
        patterns: [
            /you\s+(have|'ve|ve|hav)\s+(won|win|been\s+selected)/i,
            /congratulations.{0,40}(won|prize|winner|selected)/i,
            /claim\s+your\s+(prize|reward|gift|winnings?|free\s+iphone|cash)/i,
            /free\s+(iphone|airpods|laptop|car|cash|money|gift\s+card)/i,
            /click\s+(here|the\s+link)\s+to\s+(claim|collect|receive|win)/i,
            /\b(giveaway|give\s*away)\b.{0,30}(click|link|dm|text|whatsapp)/i,
            /send\s+(your\s+)?(details|info|number|address)\s+to\s+claim/i,
        ]
    },
    {
        label: 'Phishing / Credential Theft',
        patterns: [
            /verify\s+your\s+(account|whatsapp|bank|mpesa|paypal|number)/i,
            /your\s+account\s+(will\s+be\s+)?(suspended|closed|disabled|banned)/i,
            /enter\s+your\s+(pin|password|otp|code|details)/i,
            /otp\s+(code\s+)?(for\s+verification|expired|invalid)/i,
            /bank\s+(details?|account\s+number)\s+(required|needed|send)/i,
            /log\s*in\s+to\s+(verify|confirm|update)\s+your/i,
        ]
    },
    {
        label: 'Loan / Money Mule Scam',
        patterns: [
            /instant\s+loan.{0,30}(no\s+(credit|collateral|security)|apply\s+now)/i,
            /quick\s+(loan|cash)\s+(no\s+documents?|apply\s+now|within\s+\d+\s*(mins?|hours?))/i,
            /transfer\s+(money|funds?)\s+(for\s+me|on\s+my\s+behalf|to\s+this\s+account)/i,
            /i\s+will\s+pay\s+you\s+\d+(%|percent)\s+(commission|for\s+transferring)/i,
            /help\s+me\s+(transfer|move|send)\s+(money|funds?|cash)/i,
        ]
    },
    {
        label: 'Crypto / Forex Scam',
        patterns: [
            /forex\s+(trading\s+)?(signal|mentor|expert|guaranteed|profit)/i,
            /crypto\s+(trading\s+)?(signal|mentor|expert|guaranteed|roi)/i,
            /bitcoin\s+(flip|doubler|multiplier|generator)/i,
            /(recover\s+lost\s+crypto|crypto\s+recovery\s+expert)/i,
            /trade\s+(with\s+)?(me|us|our\s+(team|expert))\s+(and\s+earn|for\s+guaranteed)/i,
            /\$\d+\s+(per\s+day|daily)\s+(trading|forex|crypto|signal)/i,
        ]
    },
    {
        label: 'Fake Job Offer',
        patterns: [
            /earn\s+\$?\d+(,\d+)?\s+(per\s+(day|week|month)|daily|weekly)\s+(from\s+home|online|working)/i,
            /work\s+from\s+home.{0,40}earn\s+\$?\d+/i,
            /part[\s-]time\s+(job|work|earn).{0,30}(no\s+experience|anyone\s+can)/i,
            /whatsapp\s+(job|task|earn)\s+(daily|weekly|\$\d+)/i,
            /typing\s+job.{0,30}earn\s+\$?\d+/i,
            /data\s+entry.{0,40}no\s+(experience|skill|qualification)/i,
        ]
    },
];

// ─── Persistence ──────────────────────────────────────────────────────────────
const DATA_PATH = path.join(__dirname, '../data/antiscam.json');

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

let antiscamData = loadData();

function getGroupCfg(jid) {
    return antiscamData[jid] || { enabled: false, action: 'delete+warn' };
}

// ─── Match helper ─────────────────────────────────────────────────────────────
function detectScam(text) {
    for (const cat of SCAM_CATEGORIES) {
        for (const pattern of cat.patterns) {
            if (pattern.test(text)) return cat.label;
        }
    }
    return null;
}

// ─── Plugin ───────────────────────────────────────────────────────────────────
module.exports = {
    commands:    ['antiscam', 'scamcheck', 'checkscam'],
    description: 'Auto-detect and act on scam/fraud messages in groups',
    usage:       '.antiscam on | .antiscam off | .antiscam action <delete|warn|kick> | .scamcheck <text>',
    permission:  'admin',
    group:       true,
    private:     true,

    run: async (sock, message, args, ctx) => {
        const { jid, isAdmin, isOwner, reply } = ctx;
        const allowedInPrivate = isOwner;

        // Allow .scamcheck in private for owner
        const rawText = (
            message.message?.extendedTextMessage?.text ||
            message.message?.conversation || ''
        ).trim();
        const rawCmd = rawText.split(/\s+/)[0].replace(/^\./, '').toLowerCase();

        if (rawCmd === 'scamcheck' || rawCmd === 'checkscam') {
            const checkText = args.join(' ');
            if (!checkText) return reply('❓ Provide text to check.\n\nExample: `.scamcheck I will double your investment`');
            const hit = detectScam(checkText);
            if (hit) {
                return reply(fmt(`🚨 *Scam Detected!*\n\nCategory: *${hit}*\n\n_The provided text matches a known scam pattern._`));
            }
            return reply(fmt('✅ *No scam patterns detected.*\n\n_Text appears clean based on known patterns._'));
        }

        if (!isAdmin && !isOwner) return reply(fmt('⛔ Only admins can configure antiscam.'));

        const cfg = getGroupCfg(jid);
        const sub = (args[0] || '').toLowerCase();

        if (!sub) {
            const actions = ['delete+warn', 'delete', 'warn', 'kick'];
            return reply(fmt(
                `🕵️ *Anti-Scam Filter*\n\n` +
                `Status: ${cfg.enabled ? '✅ ON' : '❌ OFF'}\n` +
                `Action: *${cfg.action}*\n\n` +
                `*Commands:*\n` +
                `• \`.antiscam on\` — enable\n` +
                `• \`.antiscam off\` — disable\n` +
                `• \`.antiscam action delete+warn\` — delete msg & warn (default)\n` +
                `• \`.antiscam action delete\` — silently delete\n` +
                `• \`.antiscam action warn\` — warn only\n` +
                `• \`.antiscam action kick\` — delete + remove user\n\n` +
                `*Detects:*\n` +
                SCAM_CATEGORIES.map(c => `• ${c.label}`).join('\n') + '\n\n' +
                `• \`.scamcheck <text>\` — test any text`
            ));
        }

        if (sub === 'on') {
            antiscamData[jid] = { ...cfg, enabled: true };
            saveData(antiscamData);
            return reply(fmt(`🕵️ *Anti-Scam: ON*\n\nAction: *${cfg.action}*\nI will scan every message for fraud patterns.`));
        }

        if (sub === 'off') {
            antiscamData[jid] = { ...cfg, enabled: false };
            saveData(antiscamData);
            return reply(fmt('🕵️ *Anti-Scam: OFF*'));
        }

        if (sub === 'action') {
            const act = (args[1] || '').toLowerCase();
            const valid = ['delete+warn', 'delete', 'warn', 'kick'];
            if (!valid.includes(act)) {
                return reply(fmt(`❌ Invalid action. Choose: ${valid.map(a => `\`${a}\``).join(', ')}`));
            }
            antiscamData[jid] = { ...cfg, action: act };
            saveData(antiscamData);
            return reply(fmt(`✅ Action set to *${act}*.`));
        }

        return reply(fmt('Usage: `.antiscam on | off | action <delete+warn|delete|warn|kick>`'));
    },

    // ── Message event hook ────────────────────────────────────────────────────
    onMessage: async (sock, message, ctx) => {
        const { groupId, sender, isAdmin, isOwner, isBotAdmin } = ctx;
        if (!groupId) return;

        const cfg = getGroupCfg(groupId);
        if (!cfg.enabled) return;
        if (isAdmin || isOwner) return; // exempt admins

        const text = (
            message.message?.conversation ||
            message.message?.extendedTextMessage?.text ||
            message.message?.imageMessage?.caption ||
            message.message?.videoMessage?.caption ||
            message.message?.documentMessage?.caption ||
            ''
        );

        if (!text || text.length < 15) return;

        const hit = detectScam(text);
        if (!hit) return;

        const senderNum = sender.split('@')[0];
        const action    = cfg.action;

        // Delete
        if (action === 'delete' || action === 'delete+warn' || action === 'kick') {
            if (isBotAdmin) {
                try { await sock.sendMessage(groupId, { delete: message.key }); } catch { /* ignore */ }
            }
        }

        // Warn / notify
        if (action === 'delete+warn' || action === 'warn') {
            try {
                await sock.sendMessage(groupId, {
                    text: fmt(
                        `🚨 *Scam Alert!*\n\n` +
                        `@${senderNum} — your message was flagged as a potential *${hit}*.\n\n` +
                        `⚠️ Sharing fraudulent content may result in removal.\n` +
                        `_If this was a mistake, admins can review._`
                    ),
                    mentions: [sender]
                });
            } catch { /* ignore */ }
        }

        // Kick
        if (action === 'kick' && isBotAdmin) {
            try {
                await sock.groupParticipantsUpdate(groupId, [sender], 'remove');
                await sock.sendMessage(groupId, {
                    text: fmt(
                        `🚫 @${senderNum} was *removed* for posting suspected *${hit}* content.\n\n` +
                        `_Protect your group — report scammers to authorities._`
                    ),
                    mentions: [sender]
                });
            } catch { /* ignore */ }
        }
    }
};

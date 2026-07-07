'use strict';

const { fmt } = require('../lib/theme');

// In-memory flood tracking: { jid: { participant: { count, resetAt } } }
const floodMap  = new Map();
// Per-group settings: { jid: { enabled: bool, limit: number, window: number } }
const settings  = new Map();

const DEFAULT_LIMIT  = 7;   // messages
const DEFAULT_WINDOW = 10;  // seconds

function getSettings(jid) {
    return settings.get(jid) || { enabled: false, limit: DEFAULT_LIMIT, window: DEFAULT_WINDOW };
}

function trackMessage(jid, participant) {
    const gs = getSettings(jid);
    if (!gs.enabled) return false;

    if (!floodMap.has(jid)) floodMap.set(jid, new Map());
    const jidMap = floodMap.get(jid);

    const now    = Date.now();
    const record = jidMap.get(participant) || { count: 0, resetAt: now + gs.window * 1000 };

    if (now > record.resetAt) {
        record.count   = 1;
        record.resetAt = now + gs.window * 1000;
    } else {
        record.count++;
    }

    jidMap.set(participant, record);
    return record.count > gs.limit;
}

// Expose tracker for silva.js messages.upsert hook
global.antifloodTrack = trackMessage;
global.antifloodSettings = settings;

module.exports = {
    commands:    ['antiflood', 'floodoff', 'floodon', 'floodlimit'],
    description: 'Auto-kick members who spam messages too fast',
    usage:       '.antiflood on | .antiflood off | .antiflood limit 5 10',
    permission:  'admin',
    group:       true,
    private:     false,

    run: async (sock, message, args, ctx) => {
        const { jid, isAdmin, isBotAdmin, reply, command } = ctx;
        if (!isAdmin) return reply(fmt('⛔ Only admins can manage flood protection.'));

        const rawCmd = (message.message?.extendedTextMessage?.text ||
                        message.message?.conversation || '')
            .trim().split(/\s+/)[0].replace(/^[^\w]*/, '').toLowerCase();

        const gs = getSettings(jid);

        if (rawCmd === 'floodon' || (rawCmd === 'antiflood' && (args[0] || '').toLowerCase() === 'on')) {
            gs.enabled = true;
            settings.set(jid, gs);
            return reply(fmt(
                `🛡️ *Anti-Flood: ON*\n\n` +
                `Limit: *${gs.limit} messages* per *${gs.window}s*\n` +
                `Members who exceed this will be *removed*.\n\n` +
                `Change limit: \`.floodlimit 5 10\` (msgs window_secs)`
            ));
        }

        if (rawCmd === 'floodoff' || (rawCmd === 'antiflood' && (args[0] || '').toLowerCase() === 'off')) {
            gs.enabled = false;
            settings.set(jid, gs);
            return reply(fmt('🛡️ *Anti-Flood: OFF*'));
        }

        if (rawCmd === 'floodlimit') {
            const limit  = parseInt(args[0]);
            const window = parseInt(args[1]);
            if (!limit || limit < 2) return reply(fmt('❌ Limit must be at least 2 messages.'));
            if (!window || window < 3) return reply(fmt('❌ Window must be at least 3 seconds.'));
            gs.limit  = limit;
            gs.window = window;
            settings.set(jid, gs);
            return reply(fmt(`✅ Flood limit set: *${limit} messages* per *${window}s*`));
        }

        // Default: show status
        const state = gs.enabled ? '✅ ON' : '❌ OFF';
        return reply(fmt(
            `🛡️ *Anti-Flood Status:* ${state}\n` +
            `Limit: *${gs.limit} msgs* / *${gs.window}s*\n\n` +
            `• \`.antiflood on\` — enable\n` +
            `• \`.antiflood off\` — disable\n` +
            `• \`.floodlimit 5 10\` — 5 msgs per 10s`
        ));
    }
};

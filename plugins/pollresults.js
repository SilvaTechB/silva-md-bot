'use strict';

const { getAggregateVotesInPollMessage } = require('@whiskeysockets/baileys');
const { fmt } = require('../lib/theme');

// ─── In-process poll registry ─────────────────────────────────────────────────
// key   = messageId (string)
// value = { jid, question, meId, pollCreationMessage, pollUpdates: [] }
if (!global.pollRegistry) global.pollRegistry = new Map();

// ─── Poll update hook called from silva.js messages.update ───────────────────
// silva.js calls: if (global.pollUpdateHook) global.pollUpdateHook(key, update, sock)
global.pollUpdateHook = async (key, update, sock) => {
    const { pollUpdates } = update;
    if (!pollUpdates?.length) return;

    // The `key` here is the key of the *original poll creation* message
    const entry = global.pollRegistry.get(key.id);
    if (!entry) return; // poll not tracked by this bot session

    // Merge incoming votes into our registry
    for (const pu of pollUpdates) {
        // Avoid duplicates from the same voter/timestamp
        const exists = entry.pollUpdates.some(
            e => e.pollUpdateMessageKey?.id === pu.pollUpdateMessageKey?.id
        );
        if (!exists) entry.pollUpdates.push(pu);
    }

    // Auto-announce results to the group after each vote
    if (!entry.announceResults) return;
    try {
        const results = getAggregateVotesInPollMessage(
            { message: { [entry.msgType]: entry.pollCreationMessage }, pollUpdates: entry.pollUpdates },
            entry.meId
        );
        const total  = results.reduce((s, r) => s + r.voters.length, 0);
        const lines  = results.map(r => {
            const pct  = total ? Math.round((r.voters.length / total) * 100) : 0;
            const bar  = '█'.repeat(Math.round(pct / 10)) + '░'.repeat(10 - Math.round(pct / 10));
            return `${r.name}\n  ${bar} ${r.voters.length} vote${r.voters.length !== 1 ? 's' : ''} (${pct}%)`;
        });
        await sock.sendMessage(entry.jid, {
            text: fmt(`📊 *Poll Update* — ${entry.question}\n\n${lines.join('\n\n')}\n\n_Total votes: ${total}_`)
        });
    } catch { /* silent */ }
};

// ─── Plugin ───────────────────────────────────────────────────────────────────
module.exports = {
    commands:    ['pollresult', 'pollresults', 'pollstats', 'votes'],
    description: 'Show live results of a poll (reply to the poll message)',
    usage:       'Reply to a poll + .pollresult',
    permission:  'public',
    group:       true,
    private:     false,

    run: async (sock, message, args, ctx) => {
        const { jid, contextInfo, reply } = ctx;

        const ctxInfo  = message.message?.extendedTextMessage?.contextInfo;
        const stanzaId = ctxInfo?.stanzaId;

        if (!stanzaId) {
            return reply(fmt(
                `📊 *Poll Results*\n\n` +
                `Reply to a poll message then type \`.pollresult\` to see live vote counts.\n\n` +
                `• \`.pollresult\` — show current results\n` +
                `• \`.pollresult live\` — announce each new vote automatically`
            ));
        }

        const entry = global.pollRegistry.get(stanzaId);
        if (!entry) {
            return reply(fmt(
                `⚠️ That poll isn't tracked in this session.\n\n` +
                `_Only polls created with \`.poll\` during this bot session can be tracked._`
            ));
        }

        const rawCmd = (
            message.message?.extendedTextMessage?.text ||
            message.message?.conversation || ''
        ).trim().split(/\s+/);

        // Toggle live announcements
        if (args[0]?.toLowerCase() === 'live') {
            entry.announceResults = !entry.announceResults;
            return reply(fmt(
                entry.announceResults
                    ? `🔔 *Live poll updates ON* — I'll announce every new vote.`
                    : `🔕 *Live poll updates OFF*`
            ));
        }

        // Aggregate and display
        const results = getAggregateVotesInPollMessage(
            { message: { [entry.msgType]: entry.pollCreationMessage }, pollUpdates: entry.pollUpdates },
            entry.meId
        );

        const total = results.reduce((s, r) => s + r.voters.length, 0);

        if (total === 0) {
            return reply(fmt(`📊 *${entry.question}*\n\n_No votes yet._`));
        }

        const lines = results
            .sort((a, b) => b.voters.length - a.voters.length)
            .map((r, i) => {
                const pct  = Math.round((r.voters.length / total) * 100);
                const bar  = '█'.repeat(Math.round(pct / 10)) + '░'.repeat(10 - Math.round(pct / 10));
                const medal = i === 0 && r.voters.length > 0 ? '🥇 ' : '';
                return `${medal}*${r.name}*\n  ${bar} ${r.voters.length} vote${r.voters.length !== 1 ? 's' : ''} (${pct}%)`;
            });

        await sock.sendMessage(jid, {
            text: fmt(
                `📊 *Poll Results*\n` +
                `❓ ${entry.question}\n` +
                `─────────────────\n` +
                lines.join('\n\n') +
                `\n─────────────────\n` +
                `👥 *Total votes:* ${total}\n` +
                `_React .pollresult live to get notified on each vote_`
            ),
            contextInfo
        }, { quoted: message });
    }
};

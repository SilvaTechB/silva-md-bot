'use strict';

// Runtime toggles — override config values without editing config.env
// Read by silva.js status handler when present
if (global.autoStatusFlags === undefined) {
    global.autoStatusFlags = {
        seen:  null,   // null = use config default, true/false = runtime override
        react: null,
    };
}

const FLAGS = global.autoStatusFlags;

module.exports = {
    commands:    ['autoview', 'autolike', 'autoreact', 'autostatus', 'statusconfig'],
    description: 'Control automatic status viewing and liking at runtime',
    usage:       '.autoview on/off  |  .autolike on/off  |  .autostatus',
    permission:  'owner',
    group:       false,
    private:     true,

    run: async (sock, message, args, ctx) => {
        const { jid, contextInfo } = ctx;

        const rawCmd = (message.message?.extendedTextMessage?.text
            || message.message?.conversation || '').trim().split(/\s+/)[0].replace(/^\./, '').toLowerCase();

        const sub = (args[0] || '').toLowerCase();

        // ── .autostatus / .statusconfig — show current state ─────────────────
        if (rawCmd === 'autostatus' || rawCmd === 'statusconfig') {
            const config = require('../config');
            const seenEff  = FLAGS.seen  !== null ? FLAGS.seen  : config.AUTO_STATUS_SEEN;
            const reactEff = FLAGS.react !== null ? FLAGS.react : config.AUTO_STATUS_REACT;
            const seenSrc  = FLAGS.seen  !== null ? '_(runtime override)_' : '_(from config.env)_';
            const reactSrc = FLAGS.react !== null ? '_(runtime override)_' : '_(from config.env)_';

            return sock.sendMessage(jid, {
                text: [
                    `📊 *Auto-Status Settings*`,
                    ``,
                    `👁️ *Auto View:*   ${seenEff  ? '✅ ON' : '❌ OFF'}  ${seenSrc}`,
                    `❤️ *Auto Like:*   ${reactEff ? '✅ ON' : '❌ OFF'}  ${reactSrc}`,
                    ``,
                    `*Commands:*`,
                    `• \`.autoview on\`  — force view all statuses`,
                    `• \`.autoview off\` — stop viewing statuses`,
                    `• \`.autolike on\`  — force react/like all statuses`,
                    `• \`.autolike off\` — stop reacting to statuses`,
                    `• \`.autostatus\`   — show this panel`,
                ].join('\n'),
                contextInfo
            }, { quoted: message });
        }

        // ── .autoview on/off ──────────────────────────────────────────────────
        if (rawCmd === 'autoview') {
            if (sub !== 'on' && sub !== 'off') {
                const config = require('../config');
                const eff = FLAGS.seen !== null ? FLAGS.seen : config.AUTO_STATUS_SEEN;
                return sock.sendMessage(jid, {
                    text: `👁️ *Auto View* is currently *${eff ? 'ON' : 'OFF'}*\n\nUsage: \`.autoview on\` or \`.autoview off\``,
                    contextInfo
                }, { quoted: message });
            }
            FLAGS.seen = sub === 'on';
            return sock.sendMessage(jid, {
                text: FLAGS.seen
                    ? `👁️ *Auto View: ON*\n\n✅ Bot will now *view every status* as soon as it arrives — no exceptions.`
                    : `👁️ *Auto View: OFF*\n\n❌ Bot will stop automatically viewing statuses.`,
                contextInfo
            }, { quoted: message });
        }

        // ── .autolike / .autoreact on/off ─────────────────────────────────────
        if (rawCmd === 'autolike' || rawCmd === 'autoreact') {
            if (sub !== 'on' && sub !== 'off') {
                const config = require('../config');
                const eff = FLAGS.react !== null ? FLAGS.react : config.AUTO_STATUS_REACT;
                return sock.sendMessage(jid, {
                    text: `❤️ *Auto Like* is currently *${eff ? 'ON' : 'OFF'}*\n\nUsage: \`.autolike on\` or \`.autolike off\``,
                    contextInfo
                }, { quoted: message });
            }
            FLAGS.react = sub === 'on';
            return sock.sendMessage(jid, {
                text: FLAGS.react
                    ? `❤️ *Auto Like: ON*\n\n✅ Bot will now *react to every status* with an emoji — no exceptions.`
                    : `❤️ *Auto Like: OFF*\n\n❌ Bot will stop automatically reacting to statuses.`,
                contextInfo
            }, { quoted: message });
        }
    }
};

'use strict';

const { listThemes, setActiveTheme, getActiveTheme } = require('../lib/theme');

module.exports = {
    commands:    ['theme', 'themes', 'settheme'],
    description: 'List available themes or switch the bot theme at runtime',
    usage:       '.theme list  |  .theme set <name>  |  .theme info',
    permission:  'owner',
    group:       false,
    private:     true,

    run: async (sock, message, args, ctx) => {
        const { jid, contextInfo } = ctx;

        const sub  = (args[0] || '').toLowerCase();
        const name = (args[1] || args[0] || '').toLowerCase();

        // ── .theme / .themes / .theme list ───────────────────────────────────
        if (!sub || sub === 'list' || sub === 'themes') {
            const all     = listThemes();
            const current = (getActiveTheme()?.global?.botName) || 'Silva MD';
            const lines   = all.map((t, i) => `  ${i + 1}. *${t}*`).join('\n');
            return sock.sendMessage(jid, {
                text: [
                    `🎨 *Bot Themes* (${all.length} available)`,
                    ``,
                    `*Active theme:* ${current}`,
                    ``,
                    lines,
                    ``,
                    `*Usage:* \`.theme set <name>\``,
                    `_Example:_ \`.theme set naruto\``,
                ].join('\n'),
                contextInfo
            }, { quoted: message });
        }

        // ── .theme info ───────────────────────────────────────────────────────
        if (sub === 'info') {
            const t = getActiveTheme();
            if (!t) return sock.sendMessage(jid, { text: '⚠️ No theme loaded.', contextInfo }, { quoted: message });
            const g = t.global || {};
            return sock.sendMessage(jid, {
                image: { url: g.pic1 || '' },
                caption: [
                    `🎨 *Current Theme Info*`,
                    ``,
                    `*Name:* ${g.botName || '—'}`,
                    `*Greeting:* ${g.greet || '—'}`,
                    `*Body:* ${g.body || '—'}`,
                    `*Footer:* ${g.footer || '—'}`,
                    `*Wait msg:* ${g.wait || '—'}`,
                ].join('\n'),
                contextInfo
            }, { quoted: message });
        }

        // ── .theme set <name> ─────────────────────────────────────────────────
        if (sub === 'set' || sub === 'change' || sub === 'switch') {
            const target = (args[1] || '').toLowerCase().trim();
            if (!target) {
                return sock.sendMessage(jid, {
                    text: `Usage: \`.theme set <name>\`\n\nRun \`.theme list\` to see available themes.`,
                    contextInfo
                }, { quoted: message });
            }
            const ok = setActiveTheme(target);
            if (!ok) {
                const all = listThemes();
                return sock.sendMessage(jid, {
                    text: [
                        `❌ Theme *${target}* not found.`,
                        ``,
                        `Available themes:`,
                        all.map((t, i) => `  ${i + 1}. ${t}`).join('\n'),
                    ].join('\n'),
                    contextInfo
                }, { quoted: message });
            }
            const g = getActiveTheme()?.global || {};
            return sock.sendMessage(jid, {
                image: { url: g.pic1 || '' },
                caption: [
                    `✅ *Theme changed to: ${target}*`,
                    ``,
                    `*Bot name:*  ${g.botName || target}`,
                    `*Greeting:* ${g.greet || '—'}`,
                    `*Body:*     ${g.body || '—'}`,
                    ``,
                    `_Theme is active immediately — no restart needed._`,
                ].join('\n'),
                contextInfo
            }, { quoted: message });
        }

        // ── Catch-all: treat the whole arg as a direct theme name ────────────
        const ok = setActiveTheme(sub);
        if (ok) {
            const g = getActiveTheme()?.global || {};
            return sock.sendMessage(jid, {
                image: { url: g.pic1 || '' },
                caption: `✅ *Theme changed to: ${sub}*\n\n*Bot name:* ${g.botName || sub}`,
                contextInfo
            }, { quoted: message });
        }

        return sock.sendMessage(jid, {
            text: `❓ Unknown subcommand.\n\nUsage:\n• \`.theme list\` — see all themes\n• \`.theme set <name>\` — switch theme\n• \`.theme info\` — view current theme`,
            contextInfo
        }, { quoted: message });
    }
};

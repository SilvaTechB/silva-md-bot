'use strict';

function parseDelay(str) {
    const match = str.match(/^(\d+)(s|m|h)$/i);
    if (!match) return null;
    const n  = parseInt(match[1], 10);
    const u  = match[2].toLowerCase();
    if (u === 's') return n * 1000;
    if (u === 'm') return n * 60 * 1000;
    if (u === 'h') return n * 3600 * 1000;
    return null;
}

module.exports = {
    commands:    ['remind', 'remindme', 'reminder'],
    description: 'Set a reminder — bot will ping you after the given time',
    usage:       '.remind 10m Buy groceries',
    permission:  'public',
    group:       true,
    private:     true,

    run: async (sock, message, args, ctx) => {
        const { jid, sender, contextInfo } = ctx;
        const replyTo = ctx.isGroup ? jid : sender;

        if (!args.length) {
            return sock.sendMessage(replyTo, {
                text: '⏰ *Reminder Usage:*\n`.remind <time> <message>`\n\n*Time formats:*\n• `30s` — 30 seconds\n• `10m` — 10 minutes\n• `2h` — 2 hours\n\n*Example:*\n`.remind 30m Call Dad`',
                contextInfo
            }, { quoted: message });
        }

        const delay = parseDelay(args[0]);
        if (!delay) {
            return sock.sendMessage(replyTo, {
                text: `❌ Invalid time format. Use \`30s\`, \`10m\`, or \`2h\`.`,
                contextInfo
            }, { quoted: message });
        }

        if (delay < 5000) {
            return sock.sendMessage(replyTo, { text: '❌ Minimum reminder time is 5 seconds.', contextInfo }, { quoted: message });
        }
        if (delay > 24 * 3600 * 1000) {
            return sock.sendMessage(replyTo, { text: '❌ Maximum reminder time is 24 hours.', contextInfo }, { quoted: message });
        }

        const reminderText = args.slice(1).join(' ').trim() || 'Your reminder!';
        const timeLabel    = args[0];
        const mention      = ctx.isGroup ? `@${sender.split('@')[0]} ` : '';
        const mentionArr   = ctx.isGroup ? [sender] : [];

        await sock.sendMessage(replyTo, {
            text: `✅ Reminder set for *${timeLabel}*.\n\n📝 "${reminderText}"`,
            contextInfo
        }, { quoted: message });

        setTimeout(async () => {
            try {
                await sock.sendMessage(replyTo, {
                    text: `⏰ *Reminder!*\n\n${mention}${reminderText}`,
                    mentions: mentionArr
                });
            } catch { /* chat may be gone */ }
        }, delay);
    }
};

'use strict';

const fs = require('fs');
const path = require('path');
const dataFile = path.join(__dirname, '..', 'data', 'recurring.json');

function loadReminders() {
    try { return JSON.parse(fs.readFileSync(dataFile, 'utf8')); } catch { return {}; }
}
function saveReminders(data) {
    fs.mkdirSync(path.dirname(dataFile), { recursive: true });
    fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
}

const reminders = loadReminders();
const activeIntervals = new Map();

const intervals = {
    hourly: 3600000,
    daily: 86400000,
    weekly: 604800000,
    '12h': 43200000,
    '6h': 21600000,
    '2h': 7200000,
    '30m': 1800000,
};

function startReminder(sock, id, reminder) {
    if (activeIntervals.has(id)) clearInterval(activeIntervals.get(id));
    const interval = intervals[reminder.interval];
    if (!interval) return;

    const timer = setInterval(async () => {
        try {
            const mention = reminder.isGroup ? `@${reminder.sender.split('@')[0]} ` : '';
            const mentionArr = reminder.isGroup ? [reminder.sender] : [];
            await sock.sendMessage(reminder.chatJid, {
                text: `🔔 *Recurring Reminder*\n\n${mention}${reminder.message}\n\n_Repeats: ${reminder.interval} | Stop: \`.stopremind ${id}\`_`,
                mentions: mentionArr
            });
        } catch {}
    }, interval);
    activeIntervals.set(id, timer);
}

module.exports = {
    commands: ['rremind', 'recurringremind', 'repeatremind', 'stopremind', 'myreminders', 'clearreminders'],
    description: 'Set recurring reminders (daily, weekly, hourly, etc.)',
    usage: '.rremind daily Take vitamins | .rremind weekly Team meeting | .myreminders',
    permission: 'public',
    group: true,
    private: true,

    _init: function (sock) {
        for (const [id, reminder] of Object.entries(reminders)) {
            if (reminder.active) startReminder(sock, id, reminder);
        }
    },

    run: async (sock, message, args, ctx) => {
        const { jid, sender, contextInfo } = ctx;

        const rawCmd = (message.message?.extendedTextMessage?.text
            || message.message?.conversation || '').trim().split(/\s+/)[0].replace(/^\./, '').toLowerCase();

        if (rawCmd === 'clearreminders') {
            const userReminders = Object.entries(reminders).filter(([, r]) => r.sender === sender);
            for (const [id] of userReminders) {
                if (activeIntervals.has(id)) { clearInterval(activeIntervals.get(id)); activeIntervals.delete(id); }
                delete reminders[id];
            }
            saveReminders(reminders);
            return sock.sendMessage(jid, { text: `🗑️ *${userReminders.length} reminders cleared.*`, contextInfo }, { quoted: message });
        }

        if (rawCmd === 'stopremind') {
            const id = args[0];
            if (!id || !reminders[id]) {
                return sock.sendMessage(jid, {
                    text: '❌ Provide a valid reminder ID.\n\nUse `.myreminders` to see your IDs.',
                    contextInfo
                }, { quoted: message });
            }
            if (reminders[id].sender !== sender) {
                return sock.sendMessage(jid, { text: '❌ You can only stop your own reminders.', contextInfo }, { quoted: message });
            }
            if (activeIntervals.has(id)) { clearInterval(activeIntervals.get(id)); activeIntervals.delete(id); }
            reminders[id].active = false;
            saveReminders(reminders);
            return sock.sendMessage(jid, { text: `✅ *Reminder \`${id}\` stopped.*`, contextInfo }, { quoted: message });
        }

        if (rawCmd === 'myreminders') {
            const userReminders = Object.entries(reminders).filter(([, r]) => r.sender === sender && r.active);
            if (!userReminders.length) {
                return sock.sendMessage(jid, {
                    text: '📭 *No active recurring reminders.*\n\nSet one with:\n`.rremind daily Drink water`\n`.rremind weekly Check emails`',
                    contextInfo
                }, { quoted: message });
            }

            const list = userReminders.map(([id, r]) => {
                return `🔔 *ID:* \`${id}\`\n   📝 ${r.message}\n   🔁 Every ${r.interval}`;
            }).join('\n\n');

            return sock.sendMessage(jid, {
                text: `📋 *Your Recurring Reminders*\n\n${list}\n\n_Stop: \`.stopremind <id>\`_`,
                contextInfo
            }, { quoted: message });
        }

        if (['rremind', 'recurringremind', 'repeatremind'].includes(rawCmd)) {
            if (!args.length) {
                const intervalList = Object.keys(intervals).map(i => `• ${i}`).join('\n');
                return sock.sendMessage(jid, {
                    text: `🔁 *Recurring Reminders*\n\nSet reminders that repeat automatically!\n\n*Usage:*\n\`.rremind <interval> <message>\`\n\n*Intervals:*\n${intervalList}\n\n*Examples:*\n\`.rremind daily Take vitamins\`\n\`.rremind weekly Team standup\`\n\`.rremind 2h Drink water\`\n\n*Other commands:*\n• \`.myreminders\` — list active\n• \`.stopremind <id>\` — stop one\n• \`.clearreminders\` — stop all`,
                    contextInfo
                }, { quoted: message });
            }

            const interval = args[0].toLowerCase();
            if (!intervals[interval]) {
                return sock.sendMessage(jid, {
                    text: `❌ Invalid interval. Choose from: ${Object.keys(intervals).join(', ')}`,
                    contextInfo
                }, { quoted: message });
            }

            const msg = args.slice(1).join(' ').trim();
            if (!msg) {
                return sock.sendMessage(jid, { text: '❌ Please provide a reminder message.', contextInfo }, { quoted: message });
            }

            const userCount = Object.values(reminders).filter(r => r.sender === sender && r.active).length;
            if (userCount >= 10) {
                return sock.sendMessage(jid, { text: '❌ Max 10 active reminders. Delete some first with `.clearreminders`.', contextInfo }, { quoted: message });
            }

            const id = `r${Date.now().toString(36)}`;
            reminders[id] = {
                sender,
                chatJid: jid,
                message: msg,
                interval,
                active: true,
                isGroup: jid.endsWith('@g.us'),
                createdAt: Date.now()
            };
            saveReminders(reminders);
            startReminder(sock, id, reminders[id]);

            return sock.sendMessage(jid, {
                text: `✅ *Recurring reminder set!*\n\n🔔 *ID:* \`${id}\`\n📝 *Message:* ${msg}\n🔁 *Repeats:* Every ${interval}\n\n_Stop anytime: \`.stopremind ${id}\`_`,
                contextInfo
            }, { quoted: message });
        }
    }
};

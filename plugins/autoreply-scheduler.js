'use strict';

const fs = require('fs');
const path = require('path');
const dataFile = path.join(__dirname, '..', 'data', 'autoreply.json');

function loadSchedules() {
    try { return JSON.parse(fs.readFileSync(dataFile, 'utf8')); } catch { return {}; }
}
function saveSchedules(data) {
    fs.mkdirSync(path.dirname(dataFile), { recursive: true });
    fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
}

function isInSchedule(schedule) {
    const now = new Date();
    const tz = schedule.timezone || 'Africa/Nairobi';
    const formatter = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: 'numeric', hour12: false, timeZone: tz });
    const parts = formatter.formatToParts(now);
    const h = parseInt(parts.find(p => p.type === 'hour').value);
    const m = parseInt(parts.find(p => p.type === 'minute').value);
    const current = h * 60 + m;

    const [startH, startM] = schedule.start.split(':').map(Number);
    const [endH, endM] = schedule.end.split(':').map(Number);
    const start = startH * 60 + startM;
    const end = endH * 60 + endM;

    if (start <= end) return current >= start && current < end;
    return current >= start || current < end;
}

global.autoReplySchedules = loadSchedules();

global.checkAutoReply = function (sender) {
    const schedules = global.autoReplySchedules || {};
    const sched = schedules[sender];
    if (!sched || !sched.enabled) return null;
    if (isInSchedule(sched)) return sched.message || "I'm currently away. I'll get back to you soon!";
    return null;
};

module.exports = {
    commands: ['autoreply', 'awaymsg', 'setaway', 'awayoff'],
    description: 'Set scheduled auto-reply messages (e.g., away from 10pm-8am)',
    usage: '.autoreply 22:00 08:00 I am sleeping, will reply later',
    permission: 'public',
    group: false,
    private: true,

    run: async (sock, message, args, ctx) => {
        const { sender, contextInfo } = ctx;
        const rawCmd = (message.message?.extendedTextMessage?.text
            || message.message?.conversation || '').trim().split(/\s+/)[0].replace(/^\./, '').toLowerCase();

        const schedules = global.autoReplySchedules || {};

        if (rawCmd === 'awayoff') {
            if (schedules[sender]) {
                schedules[sender].enabled = false;
                saveSchedules(schedules);
                global.autoReplySchedules = schedules;
            }
            return sock.sendMessage(sender, {
                text: '✅ *Auto-reply disabled.*',
                contextInfo
            }, { quoted: message });
        }

        if (!args.length || args.length < 2) {
            const current = schedules[sender];
            let status = '❌ Not set';
            if (current && current.enabled) {
                status = `✅ Active: ${current.start} — ${current.end}\n📝 "${current.message}"`;
            }
            return sock.sendMessage(sender, {
                text: `⏰ *Auto-Reply Scheduler*\n\n*Status:* ${status}\n\n*Usage:*\n• \`.autoreply 22:00 08:00 I'm sleeping!\`\n• \`.awayoff\` — disable\n\n*Time format:* 24-hour (HH:MM)\nOvernight schedules work too (22:00 to 08:00).`,
                contextInfo
            }, { quoted: message });
        }

        const startTime = args[0];
        const endTime = args[1];
        const timeRegex = /^\d{1,2}:\d{2}$/;

        if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
            return sock.sendMessage(sender, {
                text: '❌ Invalid time format. Use HH:MM (24-hour).\n\nExample: `.autoreply 22:00 08:00 Sleeping!`',
                contextInfo
            }, { quoted: message });
        }

        const replyMsg = args.slice(2).join(' ').trim() || "I'm currently away. I'll get back to you soon!";

        schedules[sender] = {
            enabled: true,
            start: startTime,
            end: endTime,
            message: replyMsg,
            timezone: 'Africa/Nairobi'
        };
        saveSchedules(schedules);
        global.autoReplySchedules = schedules;

        return sock.sendMessage(sender, {
            text: `✅ *Auto-reply scheduled!*\n\n🕐 *From:* ${startTime}\n🕐 *To:* ${endTime}\n📝 *Message:* "${replyMsg}"\n\nAnyone who DMs you during this time will get your auto-reply.\nDisable anytime with \`.awayoff\``,
            contextInfo
        }, { quoted: message });
    }
};

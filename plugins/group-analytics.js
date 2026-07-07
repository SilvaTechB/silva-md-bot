'use strict';

const analytics = new Map();
global.groupAnalytics = analytics;

global.trackMessage = function (jid, sender) {
    if (!jid.endsWith('@g.us')) return;
    if (!analytics.has(jid)) {
        analytics.set(jid, { members: {}, hourly: new Array(24).fill(0), totalMessages: 0, since: Date.now() });
    }
    const data = analytics.get(jid);
    data.totalMessages++;
    const hour = new Date().getHours();
    data.hourly[hour]++;
    if (!data.members[sender]) data.members[sender] = { count: 0, lastSeen: 0 };
    data.members[sender].count++;
    data.members[sender].lastSeen = Date.now();
};

function formatDuration(ms) {
    const days = Math.floor(ms / 86400000);
    const hours = Math.floor((ms % 86400000) / 3600000);
    if (days > 0) return `${days}d ${hours}h`;
    return `${hours}h`;
}

function makeBar(val, max, len = 10) {
    const filled = Math.round((val / max) * len);
    return '█'.repeat(filled) + '░'.repeat(len - filled);
}

module.exports = {
    commands: ['analytics', 'groupstats', 'activity', 'topusers', 'peakhours'],
    description: 'View group chat analytics — top members, peak hours, activity stats',
    usage: '.analytics',
    permission: 'public',
    group: true,
    private: false,

    run: async (sock, message, args, ctx) => {
        const { jid, contextInfo } = ctx;
        const rawCmd = (message.message?.extendedTextMessage?.text
            || message.message?.conversation || '').trim().split(/\s+/)[0].replace(/^\./, '').toLowerCase();

        const data = analytics.get(jid);
        if (!data || data.totalMessages === 0) {
            return sock.sendMessage(jid, {
                text: '📊 *No analytics data yet.*\n\nThe bot tracks messages from when it was started. Keep chatting and check back later!',
                contextInfo
            }, { quoted: message });
        }

        if (rawCmd === 'topusers') {
            const sorted = Object.entries(data.members)
                .sort((a, b) => b[1].count - a[1].count)
                .slice(0, 15);

            const maxCount = sorted[0][1].count;
            let list = sorted.map(([user, info], i) => {
                const num = user.split('@')[0];
                const bar = makeBar(info.count, maxCount, 8);
                return `${i + 1}. @${num} — ${info.count} msgs ${bar}`;
            }).join('\n');

            const mentions = sorted.map(([user]) => user);

            return sock.sendMessage(jid, {
                text: `👥 *Top Members*\n\n${list}`,
                mentions,
                contextInfo
            }, { quoted: message });
        }

        if (rawCmd === 'peakhours') {
            const maxH = Math.max(...data.hourly);
            let chart = '🕐 *Peak Hours*\n\n';
            for (let h = 0; h < 24; h++) {
                const val = data.hourly[h];
                if (val > 0) {
                    const bar = makeBar(val, maxH, 12);
                    chart += `${String(h).padStart(2, '0')}:00 ${bar} ${val}\n`;
                }
            }
            return sock.sendMessage(jid, { text: chart, contextInfo }, { quoted: message });
        }

        const duration = formatDuration(Date.now() - data.since);
        const memberCount = Object.keys(data.members).length;
        const sorted = Object.entries(data.members).sort((a, b) => b[1].count - a[1].count);
        const topMember = sorted[0];
        const topNum = topMember[0].split('@')[0];
        const peakHour = data.hourly.indexOf(Math.max(...data.hourly));
        const avgPerMember = Math.round(data.totalMessages / memberCount);

        const top5 = sorted.slice(0, 5).map(([user, info], i) => {
            const num = user.split('@')[0];
            return `${i + 1}. @${num} — ${info.count} msgs`;
        }).join('\n');

        const mentions = sorted.slice(0, 5).map(([user]) => user);

        return sock.sendMessage(jid, {
            text: `📊 *Group Analytics*\n\n⏱️ *Tracking since:* ${duration} ago\n📨 *Total messages:* ${data.totalMessages}\n👥 *Active members:* ${memberCount}\n📈 *Avg per member:* ${avgPerMember}\n🕐 *Peak hour:* ${String(peakHour).padStart(2, '0')}:00\n\n🏆 *Top 5 Members:*\n${top5}\n\n_Use \`.topusers\` for full leaderboard_\n_Use \`.peakhours\` for hourly chart_`,
            mentions,
            contextInfo
        }, { quoted: message });
    }
};

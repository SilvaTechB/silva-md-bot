'use strict';

const fs = require('fs');
const path = require('path');
const dataFile = path.join(__dirname, '..', 'data', 'auditlog.json');

function loadLogs() {
    try { return JSON.parse(fs.readFileSync(dataFile, 'utf8')); } catch { return {}; }
}
function saveLogs(data) {
    fs.mkdirSync(path.dirname(dataFile), { recursive: true });
    fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
}

const auditLogs = loadLogs();
global.auditLogs = auditLogs;

global.logAction = function (jid, action, actor, target, details = '') {
    if (!jid.endsWith('@g.us')) return;
    if (!auditLogs[jid]) auditLogs[jid] = [];

    auditLogs[jid].push({
        action,
        actor,
        actorNum: actor ? actor.split('@')[0] : 'bot',
        target: target || null,
        targetNum: target ? target.split('@')[0] : null,
        details,
        timestamp: Date.now()
    });

    if (auditLogs[jid].length > 200) {
        auditLogs[jid] = auditLogs[jid].slice(-200);
    }

    if (!global._auditSaveTimer) {
        global._auditSaveTimer = setTimeout(() => {
            saveLogs(auditLogs);
            global._auditSaveTimer = null;
        }, 10000);
    }
};

module.exports = {
    commands: ['auditlog', 'audit', 'adminlog', 'actionlog', 'grouplog'],
    description: 'View admin action audit log — tracks kicks, promotes, demotes, settings changes',
    usage: '.auditlog [number] | .audit @user',
    permission: 'admin',
    group: true,
    private: false,

    run: async (sock, message, args, ctx) => {
        const { jid, isAdmin, contextInfo } = ctx;

        if (!isAdmin) {
            return sock.sendMessage(jid, { text: '⛔ Only admins can view the audit log.', contextInfo }, { quoted: message });
        }

        const logs = auditLogs[jid] || [];

        if (!logs.length) {
            return sock.sendMessage(jid, {
                text: '📋 *Audit Log*\n\nNo actions recorded yet.\n\nThe bot tracks:\n• Kicks & removals\n• Promotes & demotes\n• Group settings changes\n• Ban/unban actions\n• Welcome/goodbye toggles',
                contextInfo
            }, { quoted: message });
        }

        const mentioned = message.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
        let filtered = logs;

        if (mentioned.length) {
            const target = mentioned[0];
            filtered = logs.filter(l => l.actor === target || l.target === target);
            if (!filtered.length) {
                return sock.sendMessage(jid, {
                    text: `📋 No audit entries found for @${target.split('@')[0]}.`,
                    mentions: [target],
                    contextInfo
                }, { quoted: message });
            }
        }

        const count = parseInt(args[0]) || 20;
        const recent = filtered.slice(-count).reverse();

        const actionIcons = {
            kick: '🚫', promote: '⬆️', demote: '⬇️', ban: '🔨',
            unban: '✅', mute: '🔇', unmute: '🔊', settings: '⚙️',
            welcome: '👋', antilink: '🔗', warn: '⚠️', default: '📝'
        };

        const list = recent.map(l => {
            const icon = actionIcons[l.action] || actionIcons.default;
            const date = new Date(l.timestamp);
            const timeStr = `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
            const targetStr = l.targetNum ? ` → @${l.targetNum}` : '';
            const detailStr = l.details ? `\n   _${l.details}_` : '';
            return `${icon} *${l.action.toUpperCase()}*\n   By: @${l.actorNum}${targetStr}\n   ${timeStr}${detailStr}`;
        }).join('\n\n');

        const allMentions = [...new Set(recent.flatMap(l => [l.actor, l.target].filter(Boolean)))];

        return sock.sendMessage(jid, {
            text: `📋 *Audit Log* (last ${recent.length})\n\n${list}\n\n_Total entries: ${logs.length}_\n_Filter by user: \`.audit @user\`_`,
            mentions: allMentions,
            contextInfo
        }, { quoted: message });
    }
};

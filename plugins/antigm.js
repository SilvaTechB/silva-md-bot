'use strict';

const fs   = require('fs');
const path = require('path');
const { getStr } = require('../lib/theme');

const DATA_PATH = path.join(__dirname, '../data/antigm.json');

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

let antigmData = loadData();

function getGroupConfig(jid) {
    return antigmData[jid] || { enabled: false, action: 'delete' };
}

module.exports = {
    commands:    ['antigm'],
    description: 'Anti group mention — prevent @everyone mass-mention spam in groups. Actions: delete | warn | kick',
    permission:  'admin',
    group:       true,
    private:     false,

    async run(sock, message, args, ctx) {
        const { reply, jid } = ctx;
        const botName = getStr('botName') || 'Silva MD';
        const footer  = getStr('footer')  || '';

        const cfg = getGroupConfig(jid);
        const sub = (args[0] || '').toLowerCase();
        const arg2 = (args[1] || '').toLowerCase();

        if (!sub) {
            return reply(
                `*${botName}* — Anti Group Mention\n\n` +
                `Status: ${cfg.enabled ? '✅ ON' : '❌ OFF'}\n` +
                `Action: *${cfg.action}*\n\n` +
                `*Commands:*\n` +
                `• \`.antigm on\` — enable\n` +
                `• \`.antigm off\` — disable\n` +
                `• \`.antigm action delete\` — silently delete the message\n` +
                `• \`.antigm action warn\` — warn the sender\n` +
                `• \`.antigm action kick\` — kick the sender\n\n` +
                footer
            );
        }

        if (sub === 'on') {
            antigmData[jid] = { ...cfg, enabled: true };
            saveData(antigmData);
            return reply(`*${botName}*\n\n✅ Anti Group Mention *enabled*.\nAction: *${cfg.action}*\n\n${footer}`);
        }

        if (sub === 'off') {
            antigmData[jid] = { ...cfg, enabled: false };
            saveData(antigmData);
            return reply(`*${botName}*\n\n❌ Anti Group Mention *disabled*.\n\n${footer}`);
        }

        if (sub === 'action' && ['delete', 'warn', 'kick'].includes(arg2)) {
            antigmData[jid] = { ...cfg, action: arg2 };
            saveData(antigmData);
            return reply(`*${botName}*\n\n✅ Action set to *${arg2}*.\n\n${footer}`);
        }

        return reply(`Usage: \`.antigm [on|off|action <delete|warn|kick>]\``);
    },

    onMessage: async (sock, message, text, { jid, isGroup }) => {
        if (!isGroup) return;
        const cfg = getGroupConfig(jid);
        if (!cfg.enabled) return;
        if (message.key.fromMe) return;

        const msgObj = message.message || {};

        const hasGroupMention =
            !!msgObj.groupMentionedMessage ||
            !!(msgObj.extendedTextMessage?.groupMentionedMessage) ||
            !!(msgObj.groupMentionMessage);

        const mentionedJids = msgObj.extendedTextMessage?.contextInfo?.mentionedJid ||
                              msgObj.contextInfo?.mentionedJid || [];

        const isLargeMention = Array.isArray(mentionedJids) && mentionedJids.length >= 10;

        if (!hasGroupMention && !isLargeMention) return;

        const senderJid = message.key.participant || message.key.remoteJid;

        let isAdmin = false;
        let isBotAdmin = false;
        try {
            const meta = await sock.groupMetadata(jid);
            const botId = sock.user?.id || '';
            for (const p of (meta?.participants || [])) {
                const adm = p.admin === 'admin' || p.admin === 'superadmin';
                if (p.id === senderJid || p.lid === senderJid) isAdmin = adm;
                if (p.id === botId || p.lid === botId) isBotAdmin = adm;
            }
        } catch { /* ignore */ }

        if (isAdmin) return;

        const botName = getStr('botName') || 'Silva MD';

        try {
            await sock.sendMessage(jid, { delete: message.key });
        } catch { /* ignore */ }

        if (cfg.action === 'warn') {
            const warnMsg = `*${botName}*\n\n⚠️ @${senderJid.split('@')[0]}, group mentions are *not allowed* in this group!`;
            await sock.sendMessage(jid, {
                text: warnMsg,
                mentions: [senderJid]
            });
            return;
        }

        if (cfg.action === 'kick' && isBotAdmin) {
            try {
                await sock.groupParticipantsUpdate(jid, [senderJid], 'remove');
                await sock.sendMessage(jid, {
                    text: `*${botName}*\n\n🚫 @${senderJid.split('@')[0]} was removed for using group mentions.`,
                    mentions: [senderJid]
                });
            } catch { /* ignore */ }
        }
    }
};

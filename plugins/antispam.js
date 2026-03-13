'use strict';

const spamMap = new Map();
const LIMIT   = 5;
const WINDOW  = 5000;

const groupAntispam = new Set();

module.exports = {
    commands:    ['antispam'],
    description: 'Toggle anti-spam protection in groups',
    permission:  'admin',
    group:       true,
    private:     false,

    run: async (sock, message, args, { sender, groupId, isAdmin, contextInfo }) => {
        if (!isAdmin) {
            return sock.sendMessage(sender, { text: '❌ Only admins can toggle anti-spam.', contextInfo }, { quoted: message });
        }
        const arg = (args[0] || '').toLowerCase();
        const key = groupId;
        if (arg === 'on') {
            groupAntispam.add(key);
        } else if (arg === 'off') {
            groupAntispam.delete(key);
        } else {
            groupAntispam.has(key) ? groupAntispam.delete(key) : groupAntispam.add(key);
        }
        const enabled = groupAntispam.has(key);
        if (!global.antispamGroups) global.antispamGroups = new Set();
        enabled ? global.antispamGroups.add(key) : global.antispamGroups.delete(key);
        await sock.sendMessage(groupId, {
            text: `🛡️ *Anti-spam:* ${enabled ? '✅ Enabled' : '❌ Disabled'}\n_Members sending ${LIMIT}+ messages in ${WINDOW/1000}s will be kicked._`,
            contextInfo
        }, { quoted: message });
    },

    onMessage: async (sock, message, { groupId, sender }) => {
        if (!groupId || !global.antispamGroups?.has(groupId)) return;
        const now  = Date.now();
        const key  = `${groupId}:${sender}`;
        const hist = spamMap.get(key) || [];
        const recent = hist.filter(t => now - t < WINDOW);
        recent.push(now);
        spamMap.set(key, recent);
        if (recent.length >= LIMIT) {
            spamMap.delete(key);
            try {
                await sock.groupParticipantsUpdate(groupId, [sender], 'remove');
                await sock.sendMessage(groupId, { text: `🚫 @${sender.split('@')[0]} was kicked for spamming.`, mentions: [sender] });
            } catch {}
        }
    }
};

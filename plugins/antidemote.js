'use strict';

// Groups where anti-demote is enabled — read by silva.js event handler
const enabledGroups = new Set();
global.antiDemoteGroups = enabledGroups;

module.exports = {
    commands:    ['antidemote'],
    description: 'Kick anyone who demotes a group admin (requires bot to be admin)',
    permission:  'admin',
    group:       true,
    private:     false,

    run: async (sock, message, args, ctx) => {
        const { jid, safeSend, contextInfo, isBotAdmin } = ctx;
        const action = (args[0] || '').toLowerCase();

        if (!isBotAdmin) {
            await safeSend({
                text: '⚠️ *Anti-Demote* requires the bot to be a group admin first.',
                contextInfo
            }, { quoted: message });
            return;
        }

        if (action === 'on') {
            enabledGroups.add(jid);
            await safeSend({
                text: '🛡️ *Anti-Demote is ON*\n\nAnyone who demotes a group admin will be removed from the group.',
                contextInfo
            }, { quoted: message });
        } else if (action === 'off') {
            enabledGroups.delete(jid);
            await safeSend({
                text: '🛡️ *Anti-Demote is OFF*',
                contextInfo
            }, { quoted: message });
        } else {
            const status = enabledGroups.has(jid) ? '✅ ON' : '❌ OFF';
            await safeSend({
                text: `🛡️ *Anti-Demote*\nStatus: ${status}\n\n*Usage:*\n• \`.antidemote on\` — enable\n• \`.antidemote off\` — disable`,
                contextInfo
            }, { quoted: message });
        }
    }
};

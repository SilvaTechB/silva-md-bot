'use strict';

const antibotGroups = new Set();

module.exports = {
    commands:    ['antibot'],
    description: 'Toggle anti-bot protection in groups',
    permission:  'admin',
    group:       true,
    private:     false,
    run: async (sock, message, args, { sender, groupId, isAdmin, contextInfo }) => {
        if (!isAdmin) {
            return sock.sendMessage(sender, { text: '❌ Only admins can toggle anti-bot.', contextInfo }, { quoted: message });
        }
        const arg = (args[0] || '').toLowerCase();
        if (arg === 'on') {
            antibotGroups.add(groupId);
        } else if (arg === 'off') {
            antibotGroups.delete(groupId);
        } else {
            antibotGroups.has(groupId) ? antibotGroups.delete(groupId) : antibotGroups.add(groupId);
        }
        const enabled = antibotGroups.has(groupId);
        if (!global.antibotGroups) global.antibotGroups = new Set();
        enabled ? global.antibotGroups.add(groupId) : global.antibotGroups.delete(groupId);
        await sock.sendMessage(groupId, {
            text: `🤖 *Anti-bot:* ${enabled ? '✅ Enabled' : '❌ Disabled'}\n_Accounts that look like bots will be removed on join._`,
            contextInfo
        }, { quoted: message });
    }
};

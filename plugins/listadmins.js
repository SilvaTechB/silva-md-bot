'use strict';

module.exports = {
    commands:    ['admins', 'listadmins', 'adminlist'],
    description: 'List all group admins',
    permission:  'public',
    group:       true,
    private:     false,
    run: async (sock, message, args, { sender, groupId, contextInfo }) => {
        try {
            const meta   = await sock.groupMetadata(groupId);
            const admins = meta.participants.filter(m => m.admin);
            if (!admins.length) {
                return sock.sendMessage(groupId, { text: '❌ No admins found in this group.', contextInfo }, { quoted: message });
            }
            const list = admins.map((m, i) => {
                const num  = m.id.split('@')[0];
                const role = m.admin === 'superadmin' ? '👑 Super Admin' : '🛡️ Admin';
                return `${i + 1}. @${num} — ${role}`;
            }).join('\n');
            const mentions = admins.map(m => m.id);
            await sock.sendMessage(groupId, {
                text: `🛡️ *${meta.subject} — Admins*\n\n${list}\n\n📊 Total admins: ${admins.length}\n_Powered by Silva MD_`,
                mentions,
                contextInfo
            }, { quoted: message });
        } catch (e) {
            await sock.sendMessage(sender, { text: `❌ Failed to fetch admins: ${e.message}`, contextInfo }, { quoted: message });
        }
    }
};

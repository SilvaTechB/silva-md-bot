'use strict';

const { fmt } = require('../lib/theme');

module.exports = {
    commands:    ['groupinfo', 'ginfo', 'groupstats', 'gcinfo'],
    description: 'Show detailed group information and statistics',
    usage:       '.groupinfo',
    permission:  'member',
    group:       true,
    private:     false,

    run: async (sock, message, args, ctx) => {
        const { jid, groupMetadata, reply, contextInfo } = ctx;

        let meta = groupMetadata;
        if (!meta) {
            try { meta = await sock.groupMetadata(jid); } catch { /* ignore */ }
        }
        if (!meta) return reply(fmt('❌ Could not fetch group info.'));

        const participants = meta.participants || [];
        const admins    = participants.filter(p => p.admin);
        const superAdmins = participants.filter(p => p.admin === 'superadmin');
        const regularAdmins = participants.filter(p => p.admin === 'admin');
        const members   = participants.filter(p => !p.admin);

        const created = meta.creation
            ? new Date(meta.creation * 1000).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
            : 'Unknown';

        const restrictions = meta.announce ? '🔒 Admins only' : '🔓 All members';
        const editInfo     = meta.restrict  ? '🔒 Admins only' : '🔓 All members';
        const joinApproval = meta.joinApprovalMode ? '✅ Required' : '❌ Not required';

        const groupId = jid.split('@')[0];
        const inviteCode = await sock.groupInviteCode(jid).catch(() => null);
        const inviteLink = inviteCode ? `https://chat.whatsapp.com/${inviteCode}` : 'N/A';

        const desc = meta.desc
            ? (meta.desc.length > 200 ? meta.desc.slice(0, 200) + '…' : meta.desc)
            : '_No description_';

        const text = fmt(
            `📋 *Group Info*\n\n` +
            `*Name:* ${meta.subject || 'N/A'}\n` +
            `*ID:* ${groupId}\n` +
            `*Created:* ${created}\n` +
            `*Owner:* @${(meta.owner || '').split('@')[0] || 'Unknown'}\n\n` +
            `*👥 Members:* ${participants.length}\n` +
            `  ├ 👑 Super Admin: ${superAdmins.length}\n` +
            `  ├ 🛡️ Admin: ${regularAdmins.length}\n` +
            `  └ 👤 Members: ${members.length}\n\n` +
            `*⚙️ Settings:*\n` +
            `  ├ 📢 Send messages: ${restrictions}\n` +
            `  ├ ✏️ Edit info: ${editInfo}\n` +
            `  └ 🔑 Join approval: ${joinApproval}\n\n` +
            `*📝 Description:*\n${desc}\n\n` +
            `*🔗 Invite Link:*\n${inviteLink}`
        );

        await sock.sendMessage(jid, {
            text,
            mentions: meta.owner ? [meta.owner] : [],
            contextInfo,
        }, { quoted: message });
    }
};

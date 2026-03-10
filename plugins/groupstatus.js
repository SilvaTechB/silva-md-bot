'use strict';

module.exports = {
    commands:    ['groupstatus', 'ginfo', 'groupinfo', 'grpinfo', 'gstatus'],
    description: 'Show detailed group statistics and information',
    permission:  'public',
    group:       true,
    private:     false,

    run: async (sock, message, args, ctx) => {
        const { groupMetadata, jid, contextInfo } = ctx;

        let meta = groupMetadata;
        if (!meta) {
            try {
                meta = await sock.groupMetadata(jid);
            } catch {
                return sock.sendMessage(jid, {
                    text: '❌ Could not fetch group info.',
                    contextInfo
                }, { quoted: message });
            }
        }

        const participants = meta.participants || [];
        const admins       = participants.filter(p => p.admin === 'admin' || p.admin === 'superadmin');
        const superAdmins  = participants.filter(p => p.admin === 'superadmin');
        const members      = participants.filter(p => !p.admin);

        const createdAt = meta.creation
            ? new Date(meta.creation * 1000).toLocaleString('en-US', {
                day: 'numeric', month: 'long', year: 'numeric',
                hour: '2-digit', minute: '2-digit'
              })
            : 'Unknown';

        const ownerNum = meta.owner ? meta.owner.split('@')[0] : superAdmins[0]?.id.split('@')[0] || 'Unknown';

        let inviteLink = '';
        try {
            const code = await sock.groupInviteCode(jid);
            inviteLink = `\n🔗 *Invite Link:* https://chat.whatsapp.com/${code}`;
        } catch { /* not admin or restricted */ }

        const desc = meta.desc
            ? `\n📄 *Description:*\n${meta.desc.trim()}`
            : '';

        const announce = meta.announce ? '🔒 Admins only'  : '🌐 All members';
        const restrict = meta.restrict ? '🔒 Admins only'  : '🌐 All members';
        const ephemeral = meta.ephemeral
            ? `⏳ ${meta.ephemeral / 86400}d`
            : '❌ Off';

        const text =
            `╔══════════════════╗\n` +
            `  📊 *Group Status*\n` +
            `╚══════════════════╝\n\n` +
            `🏷️ *Name:* ${meta.subject || 'N/A'}\n` +
            `🆔 *JID:* \`${jid}\`\n` +
            `👑 *Owner:* @${ownerNum}\n` +
            `📅 *Created:* ${createdAt}\n` +
            `${desc}\n` +
            `\n👥 *Members:* ${participants.length}\n` +
            `   ├ 👑 Super Admins: ${superAdmins.length}\n` +
            `   ├ 🛡️ Admins: ${admins.length}\n` +
            `   └ 👤 Members: ${members.length}\n` +
            `\n⚙️ *Settings:*\n` +
            `   ├ 💬 Send Messages: ${announce}\n` +
            `   ├ ✏️ Edit Info: ${restrict}\n` +
            `   └ ⏳ Disappearing: ${ephemeral}` +
            `${inviteLink}`;

        const mentions = [meta.owner, ...superAdmins.map(p => p.id)].filter(Boolean);

        // Try to send with group icon
        try {
            const pp = await sock.profilePictureUrl(jid, 'image');
            await sock.sendMessage(jid, {
                image:   { url: pp },
                caption: text,
                mentions,
                contextInfo
            }, { quoted: message });
        } catch {
            await sock.sendMessage(jid, { text, mentions, contextInfo }, { quoted: message });
        }
    }
};

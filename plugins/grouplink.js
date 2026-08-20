'use strict';

module.exports = {
    commands:    ['grouplink', 'invitelink', 'link', 'revoke', 'revokelink'],
    description: 'Get or revoke the group invite link',
    usage:       '.link | .revoke',
    permission:  'admin',
    group:       true,
    private:     false,

    run: async (sock, message, args, ctx) => {
        const { jid, isAdmin, isBotAdmin, contextInfo, theme } = ctx;

        const rawCmd = (message.message?.extendedTextMessage?.text
            || message.message?.conversation || '').trim().split(/\s+/)[0].replace(/^\./, '');

        const isRevoke = /^revoke/i.test(rawCmd);

        if (!isAdmin) {
            return sock.sendMessage(jid, { text: theme.admin || '⛔ Only admins can use this command.', contextInfo }, { quoted: message });
        }
        if (!isBotAdmin) {
            return sock.sendMessage(jid, { text: theme.botAdmin || '⛔ I need to be an admin to manage the invite link.', contextInfo }, { quoted: message });
        }

        if (isRevoke) {
            await sock.groupRevokeInvite(jid);
            const newCode = await sock.groupInviteCode(jid);
            await sock.sendMessage(jid, {
                text: `🔄 *Invite link revoked!*\n\nNew link:\nhttps://chat.whatsapp.com/${newCode}`,
                contextInfo
            }, { quoted: message });
        } else {
            const code = await sock.groupInviteCode(jid);
            await sock.sendMessage(jid, {
                text: `🔗 *Group Invite Link*\n\nhttps://chat.whatsapp.com/${code}`,
                contextInfo
            }, { quoted: message });
        }
    }
};

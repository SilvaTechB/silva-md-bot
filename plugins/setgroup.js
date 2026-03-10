'use strict';

module.exports = {
    commands:    ['setname', 'setdesc', 'setdescription', 'groupname', 'groupdesc'],
    description: 'Change the group name or description',
    usage:       '.setname New Name | .setdesc New description',
    permission:  'admin',
    group:       true,
    private:     false,

    run: async (sock, message, args, ctx) => {
        const { jid, isAdmin, isBotAdmin, contextInfo, theme } = ctx;

        const rawCmd = (message.message?.extendedTextMessage?.text
            || message.message?.conversation || '').trim().split(/\s+/)[0].replace(/^\./, '');

        const isName = /^(setname|groupname)$/i.test(rawCmd);

        if (!isAdmin) {
            return sock.sendMessage(jid, { text: theme.admin || '⛔ Only admins can change group settings.', contextInfo }, { quoted: message });
        }
        if (!isBotAdmin) {
            return sock.sendMessage(jid, { text: theme.botAdmin || '⛔ I need to be an admin to edit group info.', contextInfo }, { quoted: message });
        }

        const value = args.join(' ').trim();
        if (!value) {
            const label = isName ? 'name' : 'description';
            return sock.sendMessage(jid, {
                text: `❌ Provide a new group ${label}.\n\nUsage: \`.${rawCmd} New ${label} here\``,
                contextInfo
            }, { quoted: message });
        }

        if (isName) {
            if (value.length > 100) {
                return sock.sendMessage(jid, { text: '❌ Group name cannot exceed 100 characters.', contextInfo }, { quoted: message });
            }
            await sock.groupUpdateSubject(jid, value);
            await sock.sendMessage(jid, { text: `✅ Group name updated to *${value}*`, contextInfo }, { quoted: message });
        } else {
            if (value.length > 512) {
                return sock.sendMessage(jid, { text: '❌ Description cannot exceed 512 characters.', contextInfo }, { quoted: message });
            }
            await sock.groupUpdateDescription(jid, value);
            await sock.sendMessage(jid, { text: `✅ Group description updated.`, contextInfo }, { quoted: message });
        }
    }
};

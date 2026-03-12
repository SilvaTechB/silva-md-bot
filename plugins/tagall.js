'use strict';

const { fmt } = require('../lib/theme');

module.exports = {
    commands:    ['tagall', 'mentionall', 'pingall'],
    description: 'Mention all members in the group',
    usage:       '.tagall [message]',
    permission:  'admin',
    group:       true,
    private:     false,

    run: async (sock, message, args, ctx) => {
        const { groupMetadata, jid, isAdmin, isBotAdmin, contextInfo, theme } = ctx;

        if (!isAdmin && !message.key.fromMe) {
            return sock.sendMessage(jid, {
                text: fmt(theme.admin || '⛔ Only group admins can use this command.'),
                contextInfo
            }, { quoted: message });
        }

        if (!isBotAdmin) {
            return sock.sendMessage(jid, {
                text: fmt(theme.botAdmin || '⛔ I need to be an admin to tag all members.'),
                contextInfo
            }, { quoted: message });
        }

        const participants = groupMetadata?.participants || [];
        if (!participants.length) {
            return sock.sendMessage(jid, {
                text: fmt('❌ Could not fetch group members.'),
                contextInfo
            }, { quoted: message });
        }

        const customMsg = args.join(' ').trim();
        const header = customMsg || '📢 *Attention Everyone!*';

        const mentions = participants.map(p => p.id);
        const memberLines = participants
            .map(p => `• @${p.id.split('@')[0]}`)
            .join('\n');

        const text = fmt(`${header}\n\n${memberLines}\n\n👥 *${participants.length} members tagged*`);

        await sock.sendMessage(jid, { text, mentions }, { quoted: message });
    }
};

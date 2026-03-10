'use strict';

module.exports = {
    commands:    ['hidetag', 'htag', 'stag', 'silenttag'],
    description: 'Silently mention all group members — they get notified but are not visibly tagged',
    usage:       '.hidetag <message>',
    permission:  'admin',
    group:       true,
    private:     false,

    run: async (sock, message, args, ctx) => {
        const { groupMetadata, jid, isAdmin, isBotAdmin, contextInfo, theme } = ctx;

        if (!isAdmin && !message.key.fromMe) {
            return sock.sendMessage(jid, {
                text: theme.admin || '⛔ Only group admins can use this command.',
                contextInfo
            }, { quoted: message });
        }

        if (!isBotAdmin) {
            return sock.sendMessage(jid, {
                text: theme.botAdmin || '⛔ I need to be an admin to use hidetag.',
                contextInfo
            }, { quoted: message });
        }

        if (!args.length) {
            return sock.sendMessage(jid, {
                text: '❌ *Usage:* `.hidetag <message>`\n\nSends your message while silently notifying all members.',
                contextInfo
            }, { quoted: message });
        }

        const participants = groupMetadata?.participants || [];
        if (!participants.length) {
            return sock.sendMessage(jid, {
                text: '❌ Could not fetch group members.',
                contextInfo
            }, { quoted: message });
        }

        const mentions = participants.map(p => p.id);
        const text     = args.join(' ');

        // mentions array tags everyone silently — names don't appear in the message text
        await sock.sendMessage(jid, { text, mentions });
    }
};

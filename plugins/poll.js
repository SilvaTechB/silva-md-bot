'use strict';

module.exports = {
    commands:    ['poll', 'vote'],
    description: 'Create a WhatsApp native poll in the group',
    usage:       '.poll Question | Option1 | Option2 | ...',
    permission:  'admin',
    group:       true,
    private:     false,

    run: async (sock, message, args, ctx) => {
        const { jid, isAdmin, contextInfo } = ctx;

        if (!isAdmin) {
            return sock.sendMessage(jid, { text: '⛔ Only admins can create polls.', contextInfo }, { quoted: message });
        }

        const input = args.join(' ').trim();
        if (!input) {
            return sock.sendMessage(jid, {
                text: '❌ *Usage:*\n`.poll Question | Option1 | Option2 | ...`\n\n*Example:*\n`.poll Favourite color? | Red | Blue | Green`',
                contextInfo
            }, { quoted: message });
        }

        const parts = input.split('|').map(s => s.trim()).filter(Boolean);
        if (parts.length < 3) {
            return sock.sendMessage(jid, {
                text: '❌ You need a question and at least *2 options*.\n\nExample: `.poll Best fruit? | Apple | Mango | Banana`',
                contextInfo
            }, { quoted: message });
        }

        const [question, ...options] = parts;
        if (options.length > 12) {
            return sock.sendMessage(jid, { text: '❌ Maximum *12 options* allowed.', contextInfo }, { quoted: message });
        }

        await sock.sendMessage(jid, {
            poll: {
                name:            question,
                values:          options,
                selectableCount: 1
            }
        });
    }
};

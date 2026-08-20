'use strict';

module.exports = {
    commands:    ['hello'],
    description: 'Simple hello test command',
    permission:  'public',
    group:       true,
    private:     true,
    run: async (sock, message, args, ctx) => {
        const { contextInfo } = ctx;
        const jid = message.key.remoteJid;
        await sock.sendMessage(jid, {
            text: `✅ *Hello!*\n\nArgs received: ${args.join(', ') || 'none'}`,
            contextInfo
        }, { quoted: message });
    }
};

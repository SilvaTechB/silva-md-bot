'use strict';

const config = require('../config');

module.exports = {
    commands:    ['antidelete', 'antidel'],
    description: 'Toggle anti-delete — recovers deleted and edited messages and forwards them to you',
    permission:  'owner',
    group:       true,
    private:     true,

    run: async (sock, message, args, ctx) => {
        const { safeSend, contextInfo } = ctx;
        const action = (args[0] || '').toLowerCase();

        if (action === 'on') {
            config.ANTIDELETE_GROUP   = true;
            config.ANTIDELETE_PRIVATE = true;
            await safeSend({
                text: '🛡️ *Anti-Delete is ON*\n\nDeleted and edited messages will be recovered and forwarded to you in both groups and private chats.',
                contextInfo
            }, { quoted: message });
        } else if (action === 'off') {
            config.ANTIDELETE_GROUP   = false;
            config.ANTIDELETE_PRIVATE = false;
            await safeSend({ text: '🛡️ *Anti-Delete is OFF*', contextInfo }, { quoted: message });
        } else {
            const groupStatus   = config.ANTIDELETE_GROUP   ? '✅ ON' : '❌ OFF';
            const privateStatus = config.ANTIDELETE_PRIVATE ? '✅ ON' : '❌ OFF';
            await safeSend({
                text: `🛡️ *Anti-Delete Status*\n\n📌 Groups: ${groupStatus}\n📌 Private: ${privateStatus}\n\n*Usage:*\n• \`.antidelete on\` — enable\n• \`.antidelete off\` — disable`,
                contextInfo
            }, { quoted: message });
        }
    }
};

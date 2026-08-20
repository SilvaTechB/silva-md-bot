'use strict';

const { fmt } = require('../lib/theme');

module.exports = {
    commands:    ['lock', 'unlock', 'close', 'open'],
    description: 'Lock (only admins can send) or unlock (everyone can send) the group',
    usage:       '.lock | .unlock',
    permission:  'admin',
    group:       true,
    private:     false,

    run: async (sock, message, args, ctx) => {
        const { jid, isAdmin, isBotAdmin, contextInfo, theme } = ctx;

        const rawCmd = (message.message?.extendedTextMessage?.text
            || message.message?.conversation || '').trim().split(/\s+/)[0].replace(/^\./, '');

        const isLock = /^(lock|close)$/i.test(rawCmd);

        if (!isAdmin) {
            return sock.sendMessage(jid, { text: fmt(theme.admin || '⛔ Only admins can lock or unlock the group.'), contextInfo }, { quoted: message });
        }
        if (!isBotAdmin) {
            return sock.sendMessage(jid, { text: fmt(theme.botAdmin || '⛔ I need to be an admin to change group settings.'), contextInfo }, { quoted: message });
        }

        if (isLock) {
            await sock.groupSettingUpdate(jid, 'announcement');
            await sock.sendMessage(jid, {
                text: fmt('🔒 *Group locked.*\nOnly admins can send messages now.'),
                contextInfo
            }, { quoted: message });
        } else {
            await sock.groupSettingUpdate(jid, 'not_announcement');
            await sock.sendMessage(jid, {
                text: fmt('🔓 *Group unlocked.*\nEveryone can send messages now.'),
                contextInfo
            }, { quoted: message });
        }
    }
};

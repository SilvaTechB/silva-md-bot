'use strict';

const config = require('../config');

if (typeof global.antivvEnabled === 'undefined') {
    global.antivvEnabled = config.ANTIVV !== false;
}

module.exports = {
    commands:    ['antivv', 'avv'],
    description: 'Toggle automatic view-once reveal on/off',
    permission:  'owner',
    group:       true,
    private:     true,

    run: async (sock, message, args, { sender, contextInfo }) => {
        const jid = message.key.remoteJid;

        const sub = (args[0] || '').toLowerCase();

        if (sub === 'on') {
            global.antivvEnabled = true;
        } else if (sub === 'off') {
            global.antivvEnabled = false;
        } else {
            // No argument → flip current state
            global.antivvEnabled = !global.antivvEnabled;
        }

        const state  = global.antivvEnabled;
        const icon   = state ? '✅' : '❌';
        const label  = state ? 'ENABLED' : 'DISABLED';

        await sock.sendMessage(jid, { react: { text: state ? '👁️' : '🙈', key: message.key } });
        await sock.sendMessage(jid, {
            text:
                `${icon} *Anti-ViewOnce ${label}*\n\n` +
                `${state
                    ? '👁️ All view-once messages will now be automatically revealed and forwarded to the owner.'
                    : '🙈 Automatic view-once reveal is now off. Use *.antivv on* to enable it again.'
                }`,
            contextInfo
        }, { quoted: message });
    }
};

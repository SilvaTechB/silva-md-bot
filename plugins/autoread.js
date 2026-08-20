'use strict';
const config = require('../config');

let autoReadEnabled = false;

module.exports = {
    commands:    ['autoread', 'autoreadpm', 'readall'],
    description: 'Toggle auto-read for private messages',
    permission:  'owner',
    group:       false,
    private:     true,
    run: async (sock, message, args, { sender, contextInfo }) => {
        const arg = (args[0] || '').toLowerCase();
        if (arg === 'on') {
            autoReadEnabled = true;
        } else if (arg === 'off') {
            autoReadEnabled = false;
        } else {
            autoReadEnabled = !autoReadEnabled;
        }
        global.autoReadPM = autoReadEnabled;
        await sock.sendMessage(sender, {
            text: `📖 *Auto-read PM:* ${autoReadEnabled ? '✅ Enabled' : '❌ Disabled'}\n\n_The bot will ${autoReadEnabled ? 'now' : 'no longer'} mark all incoming private messages as read._`,
            contextInfo
        }, { quoted: message });
    }
};

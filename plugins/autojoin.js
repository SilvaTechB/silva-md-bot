'use strict';

const config = require('../config');

module.exports = {
    commands:    ['autojoin'],
    description: 'Manually trigger group auto-join (owner only)',
    permission:  'owner',
    group:       false,
    private:     true,

    run: async (sock, message, args, { sender, contextInfo }) => {
        const codes = (config.AUTO_JOIN_GROUPS || '').split(',').map(c => c.trim()).filter(Boolean);
        if (!codes.length) {
            return sock.sendMessage(sender, {
                text: '⚠️ No AUTO_JOIN_GROUPS configured.',
                contextInfo
            }, { quoted: message });
        }

        let joined = 0, skipped = 0, failed = 0;
        for (const code of codes) {
            try {
                await sock.groupAcceptInvite(code);
                joined++;
            } catch (e) {
                const msg = e.message || '';
                if (/already/i.test(msg) || /409/.test(msg)) skipped++;
                else { failed++; console.error(`[AutoJoin] ${code}: ${msg}`); }
            }
        }

        await sock.sendMessage(sender, {
            text: `✅ *Auto-join complete*\n• Joined: ${joined}\n• Already in: ${skipped}\n• Failed: ${failed}`,
            contextInfo
        }, { quoted: message });
    }
};

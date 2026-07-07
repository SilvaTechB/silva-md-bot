'use strict';

const { fmt } = require('../lib/theme');

module.exports = {
    commands:    ['pin', 'unpin', 'pinmsg', 'unpinmsg'],
    description: 'Pin or unpin any message in a group (reply to the message)',
    usage:       'Reply to a message + .pin | .unpin',
    permission:  'admin',
    group:       true,
    private:     false,

    run: async (sock, message, args, ctx) => {
        const { jid, isAdmin, isBotAdmin, contextInfo, reply } = ctx;

        if (!isAdmin)    return reply(fmt('⛔ Only admins can pin/unpin messages.'));
        if (!isBotAdmin) return reply(fmt('⛔ I need to be an admin to pin messages.'));

        const rawCmd = (
            message.message?.extendedTextMessage?.text ||
            message.message?.conversation || ''
        ).trim().split(/\s+/)[0].replace(/^\./, '').toLowerCase();

        const isUnpin = rawCmd === 'unpin' || rawCmd === 'unpinmsg';

        // Get the quoted/replied-to message key
        const ctxInfo = message.message?.extendedTextMessage?.contextInfo;
        const stanzaId   = ctxInfo?.stanzaId;
        const participant = ctxInfo?.participant;

        if (!stanzaId) {
            return reply(fmt(
                `❌ *Reply to a message* to ${isUnpin ? 'unpin' : 'pin'} it.\n\n` +
                `• \`.pin\` — pin the replied message\n` +
                `• \`.unpin\` — unpin a pinned message\n\n` +
                `_Duration options:_\n` +
                `• \`.pin 24h\` — pin for 24 hours\n` +
                `• \`.pin 7d\` — pin for 7 days\n` +
                `• \`.pin 30d\` — pin for 30 days\n` +
                `• \`.pin 0\` — pin forever (default)`
            ));
        }

        const targetKey = {
            remoteJid:   jid,
            fromMe:      participant ? false : true,
            id:          stanzaId,
            participant: participant || undefined,
        };

        // Duration parsing: 24h / 7d / 30d / 0 (forever)
        let duration = 0; // 0 = forever / unpin
        if (!isUnpin) {
            const durArg = (args[0] || '').toLowerCase();
            if (durArg === '24h')      duration = 86400;
            else if (durArg === '7d')  duration = 604800;
            else if (durArg === '30d') duration = 2592000;
            // else 0 = forever
        }

        try {
            await sock.sendMessage(jid, {
                pin:  targetKey,
                type: isUnpin ? 0 : 1,
            });

            const durText = duration === 86400  ? '24 hours'
                          : duration === 604800  ? '7 days'
                          : duration === 2592000 ? '30 days'
                          : 'forever';

            await sock.sendMessage(jid, {
                text: fmt(isUnpin
                    ? `📌 Message *unpinned*.`
                    : `📌 Message *pinned* (${durText}).`),
                contextInfo
            }, { quoted: message });
        } catch (err) {
            reply(fmt(`❌ Failed to ${isUnpin ? 'unpin' : 'pin'}: ${err.message}`));
        }
    }
};

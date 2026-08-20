'use strict';

const { fmt } = require('../lib/theme');

module.exports = {
    commands:    ['promote', 'demote', 'admin', 'unadmin'],
    description: 'Promote or demote a group member (reply or mention)',
    usage:       '.promote @user | .demote @user',
    permission:  'admin',
    group:       true,
    private:     false,

    run: async (sock, message, args, ctx) => {
        const { jid, isAdmin, isBotAdmin, contextInfo, mentionedJid, theme } = ctx;
        const cmd = (message.key?.fromMe ? args[-1] : undefined) || ctx.text?.split(' ')[0]?.replace(/^\./, '');

        // Determine action from the command used
        const rawCmd = message.message?.extendedTextMessage?.text?.trim().split(/\s+/)[0]
            || message.message?.conversation?.trim().split(/\s+/)[0]
            || '';
        const isPromote = /^\.?(promote|admin)$/i.test(rawCmd);

        if (!isAdmin) {
            return sock.sendMessage(jid, { text: fmt(theme.admin || '⛔ Only admins can use this command.'), contextInfo }, { quoted: message });
        }
        if (!isBotAdmin) {
            return sock.sendMessage(jid, { text: fmt(theme.botAdmin || '⛔ I need to be an admin to promote/demote members.'), contextInfo }, { quoted: message });
        }

        const targets = [];
        const quotedParticipant = message.message?.extendedTextMessage?.contextInfo?.participant;
        if (quotedParticipant) targets.push(quotedParticipant);
        if (mentionedJid?.length) mentionedJid.forEach(j => { if (!targets.includes(j)) targets.push(j); });

        if (!targets.length) {
            return sock.sendMessage(jid, {
                text: fmt(`❌ Reply to a message or mention someone.\n\nUsage:\n• \`.promote @user\` — make admin\n• \`.demote @user\` — remove admin`),
                contextInfo
            }, { quoted: message });
        }

        const action  = isPromote ? 'promote' : 'demote';
        const label   = isPromote ? '⬆️ Promoted' : '⬇️ Demoted';
        const roleTag = isPromote ? 'now an *admin*' : 'no longer an admin';

        await sock.groupParticipantsUpdate(jid, targets, action);

        const names = targets.map(j => `@${j.split('@')[0]}`).join(', ');
        await sock.sendMessage(jid, {
            text: fmt(`${label} ${names} — ${roleTag}.`),
            mentions: targets,
            contextInfo
        });
    }
};

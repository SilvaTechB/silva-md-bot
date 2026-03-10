'use strict';

module.exports = {
    commands:    ['kick', 'remove'],
    description: 'Remove a member from the group (reply to their message or mention them)',
    usage:       '.kick @user',
    permission:  'admin',
    group:       true,
    private:     false,

    run: async (sock, message, args, ctx) => {
        const { jid, isAdmin, isBotAdmin, contextInfo, groupMetadata, mentionedJid } = ctx;

        if (!isAdmin) {
            return sock.sendMessage(jid, { text: '⛔ Only admins can use this command.', contextInfo }, { quoted: message });
        }
        if (!isBotAdmin) {
            return sock.sendMessage(jid, { text: '⛔ I need to be an admin to remove members.', contextInfo }, { quoted: message });
        }

        // Collect targets: quoted message sender OR mentions
        const targets = [];

        const quotedParticipant = message.message?.extendedTextMessage?.contextInfo?.participant
            || message.message?.imageMessage?.contextInfo?.participant
            || message.message?.videoMessage?.contextInfo?.participant
            || message.message?.audioMessage?.contextInfo?.participant
            || message.message?.documentMessage?.contextInfo?.participant;

        if (quotedParticipant) targets.push(quotedParticipant);
        if (mentionedJid?.length) mentionedJid.forEach(j => { if (!targets.includes(j)) targets.push(j); });

        if (!targets.length) {
            return sock.sendMessage(jid, {
                text: '❌ Reply to a message or mention someone to kick them.\n\nUsage: `.kick @user`',
                contextInfo
            }, { quoted: message });
        }

        // Never allow kicking admins of the group
        const admins = (groupMetadata?.participants || []).filter(p => p.admin).map(p => p.id);
        const toKick = targets.filter(t => !admins.includes(t));
        const skipped = targets.filter(t => admins.includes(t));

        if (skipped.length) {
            await sock.sendMessage(jid, {
                text: `⚠️ Skipping ${skipped.map(j => `@${j.split('@')[0]}`).join(', ')} — cannot kick an admin.`,
                mentions: skipped,
                contextInfo
            });
        }

        if (!toKick.length) return;

        await sock.groupParticipantsUpdate(jid, toKick, 'remove');

        const names = toKick.map(j => `@${j.split('@')[0]}`).join(', ');
        await sock.sendMessage(jid, {
            text: `🦵 ${names} ${toKick.length === 1 ? 'has' : 'have'} been removed from the group.`,
            mentions: toKick,
            contextInfo
        });
    }
};

'use strict';

const { fmt } = require('../lib/theme');

// In-memory muted list per group: { jid: Set<participantJid> }
const mutedMembers = new Map();
global.groupMutedMembers = mutedMembers;

module.exports = {
    commands:    ['mute', 'unmute', 'mutelist'],
    description: 'Mute/unmute specific members (bot removes their messages automatically)',
    usage:       '.mute @user | .unmute @user | .mutelist',
    permission:  'admin',
    group:       true,
    private:     false,

    run: async (sock, message, args, ctx) => {
        const { jid, isAdmin, isBotAdmin, mentionedJid, reply, contextInfo } = ctx;

        if (!isAdmin) return reply(fmt('⛔ Only admins can mute/unmute members.'));

        const rawCmd = (message.message?.extendedTextMessage?.text ||
                        message.message?.conversation || '')
            .trim().split(/\s+/)[0].replace(/^[^\w]*/, '').toLowerCase();

        if (!mutedMembers.has(jid)) mutedMembers.set(jid, new Set());
        const muteSet = mutedMembers.get(jid);

        // ── mutelist ──────────────────────────────────────────────────────────
        if (rawCmd === 'mutelist') {
            if (!muteSet.size) return reply(fmt('📋 No muted members in this group.'));
            const lines = [...muteSet].map(j => `• @${j.split('@')[0]}`).join('\n');
            return sock.sendMessage(jid, {
                text: fmt(`🔇 *Muted Members (${muteSet.size}):*\n\n${lines}`),
                mentions: [...muteSet],
                contextInfo,
            }, { quoted: message });
        }

        // ── mute / unmute ─────────────────────────────────────────────────────
        const quotedParticipant = message.message?.extendedTextMessage?.contextInfo?.participant;
        const target = quotedParticipant || mentionedJid?.[0];

        if (!target) {
            return reply(fmt(
                rawCmd === 'mute'
                    ? '❌ Reply to a message or mention someone to mute them.'
                    : '❌ Reply to a message or mention someone to unmute them.'
            ));
        }

        const num = target.split('@')[0];

        // Prevent muting admins
        const isTargetAdmin = (ctx.groupMetadata?.participants || [])
            .some(p => p.id === target && p.admin);
        if (isTargetAdmin && rawCmd === 'mute') {
            return reply(fmt(`❌ Cannot mute @${num} — they are an admin.`));
        }

        if (rawCmd === 'mute') {
            muteSet.add(target);
            return sock.sendMessage(jid, {
                text: fmt(`🔇 @${num} has been *muted*.\nTheir messages will be automatically deleted.`),
                mentions: [target],
                contextInfo,
            }, { quoted: message });
        }

        if (rawCmd === 'unmute') {
            muteSet.delete(target);
            return sock.sendMessage(jid, {
                text: fmt(`🔊 @${num} has been *unmuted*.`),
                mentions: [target],
                contextInfo,
            }, { quoted: message });
        }
    }
};

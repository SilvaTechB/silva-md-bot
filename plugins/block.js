'use strict';

const { fmt } = require('../lib/theme');
const { resolvePhoneJid } = require('../lib/phone-utils');

// action = 'block' | 'unblock'
async function setBlock(sock, jid, action) {
    await sock.updateBlockStatus(jid, action);
}

module.exports = {
    commands:    ['block', 'unblock', 'blocknum', 'unblocknum'],
    description: 'Block or unblock a WhatsApp number at the account level',
    usage:       '.block @user | .blocknum 2547XXXXXXXX | .unblock @user',
    permission:  'owner',
    group:       true,
    private:     true,

    run: async (sock, message, args, ctx) => {
        const { jid, isOwner, contextInfo, mentionedJid, reply } = ctx;

        if (!isOwner) return reply(fmt('⛔ Only the owner can block/unblock numbers.'));

        const rawCmd = (
            message.message?.extendedTextMessage?.text ||
            message.message?.conversation || ''
        ).trim().split(/\s+/)[0].replace(/^\./, '').toLowerCase();

        const isBlock   = rawCmd === 'block'   || rawCmd === 'blocknum';
        const isUnblock = rawCmd === 'unblock' || rawCmd === 'unblocknum';

        // ── Collect targets ────────────────────────────────────────────────
        const targets = [];

        // Reply-quoted participant
        const quoted = message.message?.extendedTextMessage?.contextInfo?.participant
                    || message.message?.extendedTextMessage?.contextInfo?.remoteJid;
        if (quoted) {
            const resolved = resolvePhoneJid(quoted);
            if (resolved) targets.push(resolved);
        }

        // @mentions
        if (mentionedJid?.length) {
            for (const j of mentionedJid) {
                const resolved = resolvePhoneJid(j);
                if (resolved && !targets.includes(resolved)) targets.push(resolved);
            }
        }

        // Raw phone number arg (blocknum / unblocknum)
        if (!targets.length && args[0]) {
            const digits = args[0].replace(/\D/g, '');
            if (digits.length >= 7) targets.push(`${digits}@s.whatsapp.net`);
        }

        if (!targets.length) {
            const verb = isBlock ? 'block' : 'unblock';
            return reply(fmt(
                `❌ No target found.\n\n` +
                `*Usage:*\n` +
                `• \`.${verb} @user\` — mention them\n` +
                `• Reply to their message + \`.${verb}\`\n` +
                `• \`.${verb}num 2547XXXXXXXX\` — by phone number`
            ));
        }

        const action = isBlock ? 'block' : 'unblock';
        const emoji  = isBlock ? '🚫' : '✅';
        const verb   = isBlock ? 'Blocked' : 'Unblocked';

        const results = [];
        for (const t of targets) {
            const num = t.split('@')[0];
            try {
                await setBlock(sock, t, action);
                results.push(`${emoji} *${verb}:* +${num}`);
            } catch (e) {
                results.push(`❌ Failed for +${num}: ${e.message}`);
            }
        }

        await sock.sendMessage(jid, {
            text: fmt(results.join('\n')),
            mentions: targets,
            contextInfo
        }, { quoted: message });
    }
};

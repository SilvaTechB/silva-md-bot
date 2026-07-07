'use strict';

module.exports = {
    commands:    ['broadcast', 'bc'],
    description: 'Broadcast a message to all groups the bot is in (owner only)',
    usage:       '.broadcast Your message here',
    permission:  'owner',
    group:       true,
    private:     true,

    run: async (sock, message, args, ctx) => {
        const { jid, contextInfo } = ctx;

        const text = args.join(' ').trim();
        if (!text) {
            return sock.sendMessage(jid, {
                text: '❌ Provide a message to broadcast.\n\nExample: `.broadcast Hello everyone!`',
                contextInfo
            }, { quoted: message });
        }

        let groups;
        try {
            groups = await sock.groupFetchAllParticipating();
        } catch (e) {
            return sock.sendMessage(jid, { text: `❌ Failed to fetch groups: ${e.message}`, contextInfo }, { quoted: message });
        }

        const groupJids = Object.keys(groups);
        if (!groupJids.length) {
            return sock.sendMessage(jid, { text: '❌ Bot is not in any groups.', contextInfo }, { quoted: message });
        }

        await sock.sendMessage(jid, {
            text: `📢 Broadcasting to *${groupJids.length}* group(s)…`,
            contextInfo
        }, { quoted: message });

        let sent = 0, failed = 0;
        for (const g of groupJids) {
            try {
                await sock.sendMessage(g, { text: `📢 *Broadcast*\n\n${text}` });
                sent++;
                await new Promise(r => setTimeout(r, 800));
            } catch {
                failed++;
            }
        }

        await sock.sendMessage(jid, {
            text: `✅ Broadcast complete.\n• Sent: *${sent}*\n• Failed: *${failed}*`,
            contextInfo
        });
    }
};

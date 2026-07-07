'use strict';

module.exports = {
    commands:    ['dmall', 'dmmembers', 'msgall'],
    description: 'Send a DM to every member of the current group (owner only)',
    permission:  'owner',
    group:       true,
    private:     false,

    run: async (sock, message, args, ctx) => {
        const { jid, groupMetadata, contextInfo } = ctx;

        if (!args.length) {
            return sock.sendMessage(jid, {
                text: `❌ *Please provide a message to send.*\n\nUsage: \`.dmall <your message>\``,
                contextInfo
            }, { quoted: message });
        }

        const text = args.join(' ');

        let meta = groupMetadata;
        if (!meta) {
            try {
                meta = await sock.groupMetadata(jid);
            } catch (e) {
                return sock.sendMessage(jid, {
                    text: `❌ Could not fetch group members: ${e.message}`,
                    contextInfo
                }, { quoted: message });
            }
        }

        const participants = (meta.participants || []).filter(p => {
            const isBot = p.id.replace(/:[^@]+/, '').split('@')[0] === (sock.user?.id || '').replace(/:[^@]+/, '').split('@')[0];
            return !isBot;
        });

        if (!participants.length) {
            return sock.sendMessage(jid, {
                text: `❌ No members found in this group.`,
                contextInfo
            }, { quoted: message });
        }

        await sock.sendMessage(jid, {
            text: `📨 *Broadcasting to ${participants.length} members...*`,
            contextInfo
        }, { quoted: message });

        let sent = 0;
        let failed = 0;

        for (const p of participants) {
            const memberJid = p.id;
            try {
                await sock.sendMessage(memberJid, { text });
                sent++;
                await new Promise(r => setTimeout(r, 500));
            } catch {
                failed++;
            }
        }

        await sock.sendMessage(jid, {
            text: `✅ *Broadcast complete*\n\n📬 Sent: ${sent}\n❌ Failed: ${failed}`,
            contextInfo
        }, { quoted: message });
    }
};

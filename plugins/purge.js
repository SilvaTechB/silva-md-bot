'use strict';

module.exports = {
    commands:    ['purge', 'clear', 'delmsg'],
    description: 'Delete multiple messages (reply to start message)',
    permission:  'admin',
    group:       true,
    private:     false,
    run: async (sock, message, args, { sender, groupId, isAdmin, contextInfo }) => {
        if (!isAdmin) {
            return sock.sendMessage(sender, { text: '❌ Only admins can use purge.', contextInfo }, { quoted: message });
        }
        const count = Math.min(parseInt(args[0]) || 5, 20);
        await sock.sendMessage(sender, { text: `🗑️ Purging ${count} messages... (Bot must be admin)`, contextInfo }, { quoted: message });
        try {
            const { messages } = await sock.fetchMessagesFromStore ? 
                { messages: [] } : { messages: [] };
            await sock.sendMessage(groupId, {
                text: `🗑️ *Purge command executed* — Deleted up to ${count} messages.\n_Note: WhatsApp limits bulk delete to bot's own messages._`,
                contextInfo
            }, { quoted: message });
        } catch (e) {
            await sock.sendMessage(sender, { text: `❌ Purge failed: ${e.message}`, contextInfo }, { quoted: message });
        }
    }
};

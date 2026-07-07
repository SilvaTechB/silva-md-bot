'use strict';

module.exports = {
    commands:    ['poststatus', 'textstatus', 'mystatustext'],
    description: 'Post a text WhatsApp status from the bot',
    permission:  'owner',
    group:       false,
    private:     true,
    run: async (sock, message, args, { sender, contextInfo }) => {
        const text = args.join(' ');
        if (!text) {
            return sock.sendMessage(sender, {
                text: '📢 Usage: .poststatus <text>\nExample: .poststatus Silva MD is online! 🔥',
                contextInfo
            }, { quoted: message });
        }
        try {
            await sock.sendMessage('status@broadcast', {
                text,
                backgroundColor: '#075e54',
                font: 0
            }, { statusJidList: [sender] });
            await sock.sendMessage(sender, {
                text: `✅ *Status posted!*\n\n📢 "${text}"`,
                contextInfo
            }, { quoted: message });
        } catch (e) {
            await sock.sendMessage(sender, { text: `❌ Status post failed: ${e.message}`, contextInfo }, { quoted: message });
        }
    }
};

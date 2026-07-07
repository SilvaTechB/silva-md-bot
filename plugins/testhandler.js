'use strict';

module.exports = {
    commands:    ['testhandler'],
    description: 'Internal diagnostics — owner only',
    permission:  'owner',
    group:       true,
    private:     true,
    run: async (sock, message, args, { sender, contextInfo }) => {
        const sub = args[0]?.toLowerCase() || 'status';

        const info =
`🔧 *Handler Diagnostics*

📦 *Sub-command:* ${sub}
🕒 *Timestamp:* ${new Date().toISOString()}
📊 *Memory:* ${(process.memoryUsage().rss / 1048576).toFixed(1)} MB
⏳ *Uptime:* ${Math.floor(process.uptime())}s`;

        await sock.sendMessage(sender, { text: info, contextInfo }, { quoted: message });
    }
};

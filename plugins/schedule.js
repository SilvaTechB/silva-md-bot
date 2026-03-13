'use strict';

module.exports = {
    commands:    ['schedule', 'remind2', 'setmsg'],
    description: 'Schedule a message to be sent after a delay',
    permission:  'owner',
    group:       true,
    private:     true,
    run: async (sock, message, args, { sender, groupId, contextInfo }) => {
        const delayStr = args[0];
        const text     = args.slice(1).join(' ');
        if (!delayStr || !text) {
            return sock.sendMessage(sender, {
                text: '⏰ Usage: .schedule <delay> <message>\nDelay formats: 30s, 5m, 1h\nExample: .schedule 5m Good morning everyone!',
                contextInfo
            }, { quoted: message });
        }
        let ms = 0;
        const match = delayStr.match(/^(\d+)(s|m|h)$/);
        if (!match) {
            return sock.sendMessage(sender, { text: '❌ Invalid delay. Use: 30s, 5m, 1h', contextInfo }, { quoted: message });
        }
        const val  = parseInt(match[1]);
        const unit = match[2];
        if (unit === 's') ms = val * 1000;
        else if (unit === 'm') ms = val * 60000;
        else if (unit === 'h') ms = val * 3600000;
        if (ms > 3600000 * 24) {
            return sock.sendMessage(sender, { text: '❌ Maximum delay is 24 hours.', contextInfo }, { quoted: message });
        }
        const target = groupId || sender;
        await sock.sendMessage(sender, {
            text: `✅ *Message scheduled!*\n📩 Target: ${groupId ? 'This group' : 'You'}\n⏰ Delay: ${delayStr}\n📝 Message: ${text}`,
            contextInfo
        }, { quoted: message });
        setTimeout(async () => {
            try {
                await sock.sendMessage(target, { text: `⏰ *Scheduled Message*\n\n${text}` });
            } catch (e) {
                console.warn('[Schedule] Failed to send scheduled message:', e.message);
            }
        }, ms);
    }
};

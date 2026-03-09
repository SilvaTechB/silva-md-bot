'use strict';

module.exports = {
    commands:    ['flip', 'coin', 'dice', 'roll'],
    description: 'Flip a coin or roll dice',
    usage:       '.flip  •  .dice  •  .dice 6  •  .roll 2d6',
    permission:  'public',
    group:       true,
    private:     true,

    run: async (sock, message, args, ctx) => {
        const { contextInfo } = ctx;
        const jid     = message.key.remoteJid;
        const cmd     = (message.key?.id && ctx?.command) || args[-1] || 'flip';
        const rawCmd  = ctx?.command || 'flip';

        if (rawCmd === 'flip' || rawCmd === 'coin') {
            const result = Math.random() < 0.5 ? 'HEADS 🪙' : 'TAILS 💿';
            return sock.sendMessage(jid, {
                text: `🪙 *Coin Flip*\n\n${result}!`,
                contextInfo
            }, { quoted: message });
        }

        // dice / roll
        let sides = 6;
        let count = 1;
        const rollArg = args[0] || '';
        if (rollArg.toLowerCase().includes('d')) {
            const parts = rollArg.toLowerCase().split('d');
            count = Math.min(Math.max(parseInt(parts[0]) || 1, 1), 20);
            sides = Math.min(Math.max(parseInt(parts[1]) || 6, 2), 100);
        } else if (!isNaN(parseInt(rollArg))) {
            sides = Math.min(Math.max(parseInt(rollArg), 2), 100);
        }

        const rolls = Array.from({ length: count }, () => Math.floor(Math.random() * sides) + 1);
        const total = rolls.reduce((a, b) => a + b, 0);
        const rollStr = rolls.join(', ');

        await sock.sendMessage(jid, {
            text:
                `🎲 *Dice Roll* (${count}d${sides})\n\n` +
                `🎰 *Rolls:* ${rollStr}\n` +
                (count > 1 ? `➕ *Total:* ${total}\n` : '') +
                `\n> _Powered by Silva MD_`,
            contextInfo
        }, { quoted: message });
    }
};

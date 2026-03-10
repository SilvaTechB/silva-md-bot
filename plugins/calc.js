'use strict';

module.exports = {
    commands:    ['calc', 'calculate', 'math'],
    description: 'Evaluate a math expression',
    usage:       '.calc <expression>',
    permission:  'public',
    group:       true,
    private:     true,

    run: async (sock, message, args, ctx) => {
        const { contextInfo } = ctx;
        const jid = message.key.remoteJid;
        if (!args.length) {
            return sock.sendMessage(jid, {
                text: `❌ *Usage:* \`.calc <expression>\`\n_Examples:_\n• \`.calc 25 * 4\`\n• \`.calc (100 + 50) / 3\`\n• \`.calc 2 ** 10\``,
                contextInfo
            }, { quoted: message });
        }
        const expr = args.join(' ').replace(/[^0-9+\-*/().%, \tMathsqrtpowabsceilflooroundrndmlogIE]/g, '');
        try {
            const result = Function('"use strict"; return (' + expr + ')')();
            if (typeof result !== 'number' || !isFinite(result)) throw new Error('Invalid result');
            await sock.sendMessage(jid, {
                text: `🧮 *Calculator*\n\n📥 *Input:*  \`${args.join(' ')}\`\n📤 *Result:* \`${result.toLocaleString()}\``,
                contextInfo
            }, { quoted: message });
        } catch {
            await sock.sendMessage(jid, {
                text: `❌ Invalid expression: \`${args.join(' ')}\``,
                contextInfo
            }, { quoted: message });
        }
    }
};

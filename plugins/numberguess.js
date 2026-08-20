'use strict';

const sessions = new Map();

module.exports = {
    commands:    ['numguess', 'guessnumber', 'ng'],
    description: 'Number guessing game (1–100)',
    permission:  'public',
    group:       true,
    private:     true,
    run: async (sock, message, args, { sender, groupId, contextInfo }) => {
        const chatId = groupId || sender;
        const arg    = args[0];

        if (!arg || arg === 'start') {
            const num = Math.floor(Math.random() * 100) + 1;
            sessions.set(chatId, { number: num, tries: 0, maxTries: 7 });
            return sock.sendMessage(chatId, {
                text: `🎲 *Number Guessing Game Started!*\n\nI'm thinking of a number between 1 and 100.\nYou have 7 tries.\n\nType: .ng <number>`,
                contextInfo
            }, { quoted: message });
        }

        if (arg === 'stop') {
            const s = sessions.get(chatId);
            sessions.delete(chatId);
            return sock.sendMessage(chatId, {
                text: s ? `🛑 Game stopped. The number was *${s.number}*.` : '❓ No active game.',
                contextInfo
            }, { quoted: message });
        }

        const guess = parseInt(arg);
        if (isNaN(guess) || guess < 1 || guess > 100) {
            return sock.sendMessage(chatId, { text: '❌ Enter a number between 1 and 100.', contextInfo }, { quoted: message });
        }

        const s = sessions.get(chatId);
        if (!s) return sock.sendMessage(chatId, { text: '❓ No active game. Type .ng start to begin.', contextInfo }, { quoted: message });

        s.tries++;
        if (guess === s.number) {
            sessions.delete(chatId);
            return sock.sendMessage(chatId, {
                text: `🎉 *Correct!* The number was *${s.number}*!\n🏆 You got it in ${s.tries} ${s.tries === 1 ? 'try' : 'tries'}!`,
                contextInfo
            }, { quoted: message });
        }
        if (s.tries >= s.maxTries) {
            sessions.delete(chatId);
            return sock.sendMessage(chatId, { text: `💀 *Game over!* The number was *${s.number}*.`, contextInfo }, { quoted: message });
        }
        const hint   = guess < s.number ? '📈 Too low!' : '📉 Too high!';
        const left   = s.maxTries - s.tries;
        await sock.sendMessage(chatId, {
            text: `${hint} ${left} ${left === 1 ? 'try' : 'tries'} left.`,
            contextInfo
        }, { quoted: message });
    }
};

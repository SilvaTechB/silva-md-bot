'use strict';

const WORDS = ['javascript','python','algorithm','database','network','server','browser','compiler','framework','library','variable','function','interface','protocol','encryption','authentication','deployment','repository','middleware','callback'];
const STAGES = ['😐','😮','😬','😰','😨','😱','💀'];

const sessions = new Map();

module.exports = {
    commands:    ['hangman', 'hm'],
    description: 'Play a hangman word guessing game',
    permission:  'public',
    group:       true,
    private:     true,
    run: async (sock, message, args, { sender, groupId, contextInfo }) => {
        const chatId = groupId || sender;
        const arg    = (args[0] || '').toLowerCase();

        if (arg === 'stop') {
            sessions.delete(chatId);
            return sock.sendMessage(chatId, { text: '🛑 Hangman stopped.', contextInfo }, { quoted: message });
        }

        if (arg && arg.length === 1 && /[a-z]/.test(arg)) {
            const s = sessions.get(chatId);
            if (!s) return sock.sendMessage(chatId, { text: '❓ No active hangman. Type .hangman to start.', contextInfo }, { quoted: message });
            if (s.guessed.includes(arg)) {
                return sock.sendMessage(chatId, { text: `⚠️ You already guessed *${arg.toUpperCase()}*`, contextInfo }, { quoted: message });
            }
            s.guessed.push(arg);
            const correct = s.word.includes(arg);
            if (!correct) s.wrong++;
            const display = s.word.split('').map(c => s.guessed.includes(c) ? c.toUpperCase() : '_').join(' ');
            const won  = !display.includes('_');
            const lost = s.wrong >= 6;
            sessions.set(chatId, s);
            if (won) {
                sessions.delete(chatId);
                return sock.sendMessage(chatId, { text: `🎉 *You won! The word was: ${s.word.toUpperCase()}*\n\n${display}`, contextInfo }, { quoted: message });
            }
            if (lost) {
                sessions.delete(chatId);
                return sock.sendMessage(chatId, { text: `💀 *Game over! The word was: ${s.word.toUpperCase()}*`, contextInfo }, { quoted: message });
            }
            return sock.sendMessage(chatId, {
                text: `${STAGES[s.wrong]} *Hangman*\n\n${display}\n\n❌ Wrong: ${s.guessed.filter(c => !s.word.includes(c)).join(', ').toUpperCase() || 'none'}\n💡 Guess a letter: .hm <letter>`,
                contextInfo
            }, { quoted: message });
        }

        const word = WORDS[Math.floor(Math.random() * WORDS.length)];
        sessions.set(chatId, { word, guessed: [], wrong: 0 });
        const display = '_ '.repeat(word.length).trim();
        await sock.sendMessage(chatId, {
            text: `😐 *Hangman Started!*\n\n${display}\n\n📏 ${word.length} letters | 6 chances\n💡 Guess: .hm <letter>  |  Stop: .hm stop`,
            contextInfo
        }, { quoted: message });
    }
};

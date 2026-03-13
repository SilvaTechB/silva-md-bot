'use strict';

const WORDS = ['elephant','keyboard','mountain','freedom','science','hospital','library','diamond','journey','horizon','pyramid','thunder','whisper','gallery','captain','dolphin','mystery','explore','balance','harmony'];
const sessions = new Map();

function scramble(word) {
    const arr = word.split('');
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    const s = arr.join('');
    return s === word ? scramble(word) : s;
}

module.exports = {
    commands:    ['wordscramble', 'unscramble', 'ws'],
    description: 'Unscramble the word game',
    permission:  'public',
    group:       true,
    private:     true,
    run: async (sock, message, args, { sender, groupId, contextInfo }) => {
        const chatId = groupId || sender;
        const arg    = args[0]?.toLowerCase();

        if (arg && arg !== 'start' && arg !== 'hint') {
            const s = sessions.get(chatId);
            if (!s) return sock.sendMessage(chatId, { text: '❓ No active game. Type .ws to start.', contextInfo }, { quoted: message });
            if (arg === s.word) {
                sessions.delete(chatId);
                return sock.sendMessage(chatId, { text: `🎉 *Correct!* The word was *${s.word.toUpperCase()}*!`, contextInfo }, { quoted: message });
            }
            return sock.sendMessage(chatId, { text: `❌ Wrong! Try again. Scrambled: *${s.scrambled.toUpperCase()}*`, contextInfo }, { quoted: message });
        }

        if (arg === 'hint') {
            const s = sessions.get(chatId);
            if (!s) return sock.sendMessage(chatId, { text: '❓ No active game.', contextInfo }, { quoted: message });
            return sock.sendMessage(chatId, { text: `💡 Hint: The word starts with *${s.word[0].toUpperCase()}* and has *${s.word.length}* letters.`, contextInfo }, { quoted: message });
        }

        const word     = WORDS[Math.floor(Math.random() * WORDS.length)];
        const scrambled = scramble(word);
        sessions.set(chatId, { word, scrambled, startedAt: Date.now() });
        setTimeout(() => {
            const s = sessions.get(chatId);
            if (s && s.word === word) {
                sessions.delete(chatId);
                sock.sendMessage(chatId, { text: `⏰ *Time's up!* The word was *${word.toUpperCase()}*.` }).catch(() => {});
            }
        }, 60000);
        await sock.sendMessage(chatId, {
            text: `🔤 *Word Scramble*\n\nUnscramble this word:\n*${scrambled.toUpperCase()}*\n\n💡 Type .ws hint for a hint\n⏰ 60 seconds!`,
            contextInfo
        }, { quoted: message });
    }
};

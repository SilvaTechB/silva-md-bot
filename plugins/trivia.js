'use strict';
const axios = require('axios');

const sessions = new Map();

module.exports = {
    commands:    ['trivia', 'quiz'],
    description: 'Play a trivia quiz game',
    permission:  'public',
    group:       true,
    private:     true,
    run: async (sock, message, args, { sender, groupId, contextInfo }) => {
        const chatId = groupId || sender;
        const arg    = (args[0] || '').toLowerCase();
        if (arg === 'answer' || arg === 'a') {
            const session = sessions.get(chatId);
            if (!session) return sock.sendMessage(chatId, { text: '❓ No active trivia. Start one with .trivia', contextInfo }, { quoted: message });
            const ans = args.slice(1).join(' ').trim().toLowerCase();
            const correct = session.answer.toLowerCase();
            const isRight  = ans === correct || ans === session.answerIndex;
            sessions.delete(chatId);
            return sock.sendMessage(chatId, {
                text: isRight
                    ? `✅ *Correct!* 🎉 The answer is: *${session.answer}*`
                    : `❌ *Wrong!* The correct answer was: *${session.answer}*`,
                contextInfo
            }, { quoted: message });
        }
        try {
            const { data } = await axios.get('https://opentdb.com/api.php?amount=1&type=multiple', { timeout: 10000 });
            const q       = data.results?.[0];
            if (!q) throw new Error('No question received');
            const decode  = s => s.replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#039;/g,"'");
            const question = decode(q.question);
            const correct  = decode(q.correct_answer);
            const options  = [...q.incorrect_answers.map(decode), correct].sort(() => Math.random() - 0.5);
            const labels   = ['A','B','C','D'];
            const answerIdx = labels[options.indexOf(correct)];
            sessions.set(chatId, { answer: correct, answerIndex: answerIdx.toLowerCase(), expiresAt: Date.now() + 30000 });
            setTimeout(() => {
                if (sessions.has(chatId)) {
                    sessions.delete(chatId);
                    sock.sendMessage(chatId, { text: `⏰ *Time's up!* The answer was: *${correct}*` }).catch(() => {});
                }
            }, 30000);
            const optText = options.map((o, i) => `${labels[i]}. ${o}`).join('\n');
            await sock.sendMessage(chatId, {
                text:
`❓ *Trivia — ${decode(q.category)}*
🎯 Difficulty: ${q.difficulty}

${question}

${optText}

💡 Reply: .trivia a <A/B/C/D>  (30 seconds!)`,
                contextInfo
            }, { quoted: message });
        } catch (e) {
            await sock.sendMessage(chatId, { text: `❌ Trivia failed: ${e.message}`, contextInfo }, { quoted: message });
        }
    }
};

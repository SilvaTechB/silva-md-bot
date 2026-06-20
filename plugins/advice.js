'use strict';
const axios = require('axios');

// adviceslip.com has frequent timeouts — removed as primary.
// Using zenquotes.io (confirmed working 2026-06) as primary.

const LOCAL_ADVICE = [
    "Take breaks. Your brain needs rest to function well.",
    "Drink enough water today. Small habits lead to big changes.",
    "Before you speak, ask yourself: is it true, is it kind, is it necessary?",
    "Comparison is the thief of joy. Run your own race.",
    "You don't have to be great to start, but you have to start to be great.",
    "Treat yourself the way you would treat a good friend.",
    "Progress, not perfection, is the goal.",
    "The best investment you can make is in yourself.",
    "Do one thing every day that scares you — that's where growth lives.",
    "Forgiveness is not about the other person. It's about freeing yourself.",
    "Invest in experiences, not things — memories last longer.",
    "Say no to good things so you can say yes to great ones.",
    "Your energy is your most valuable resource. Protect it.",
    "Respond, don't react. There's a difference.",
    "Stop waiting for the perfect moment. Take the moment and make it perfect.",
];

module.exports = {
    commands:    ['advice', 'tip'],
    description: 'Get a random piece of advice',
    permission:  'public',
    group:       true,
    private:     true,

    run: async (sock, message, args, ctx) => {
        const { contextInfo } = ctx;
        const jid = message.key.remoteJid;
        let text;

        // 1. Try zenquotes.io (confirmed working 2026-06, has advice category)
        try {
            const res = await axios.get(
                'https://zenquotes.io/api/random',
                { headers: { 'User-Agent': 'SilvaMD-Bot/2.0' }, timeout: 7000 }
            );
            const q = Array.isArray(res.data) ? res.data[0] : res.data;
            if (q?.q && q?.a) {
                text = `💡 *Advice*\n\n"${q.q}"\n\n— _${q.a}_`;
            } else throw new Error('empty');
        } catch {
            // 2. Try adviceslip as secondary (was primary before; kept as backup)
            try {
                const res = await axios.get(
                    'https://api.adviceslip.com/advice',
                    { headers: { 'Accept': 'application/json' }, timeout: 5000 }
                );
                const slip = res.data?.slip;
                if (slip?.advice) {
                    text = `💡 *Advice #${slip.id}*\n\n"${slip.advice}"`;
                } else throw new Error('empty');
            } catch {
                // 3. Local fallback — always works
                text = `💡 *Advice*\n\n"${LOCAL_ADVICE[Math.floor(Math.random() * LOCAL_ADVICE.length)]}"`;
            }
        }

        await sock.sendMessage(jid, { text, contextInfo }, { quoted: message });
    }
};

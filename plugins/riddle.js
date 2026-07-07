'use strict';
const axios = require('axios');

const RIDDLES = [
    { q: "I speak without a mouth and hear without ears. I have no body, but I come alive with wind. What am I?", a: "An echo" },
    { q: "The more you take, the more you leave behind. What am I?", a: "Footsteps" },
    { q: "I have cities, but no houses live there. I have mountains, but no trees grow. What am I?", a: "A map" },
    { q: "What has hands but can't clap?", a: "A clock" },
    { q: "I'm light as a feather, but even the world's strongest person can't hold me for more than a few minutes. What am I?", a: "Breath" },
    { q: "What gets wetter the more it dries?", a: "A towel" },
    { q: "I have a head and a tail, but no body. What am I?", a: "A coin" },
    { q: "What has to be broken before you can use it?", a: "An egg" },
    { q: "What goes up but never comes down?", a: "Your age" },
    { q: "What can you catch but not throw?", a: "A cold" },
    { q: "The more you have of it, the less you see. What is it?", a: "Darkness" },
    { q: "What has one eye but cannot see?", a: "A needle" },
    { q: "I'm full of holes but still hold water. What am I?", a: "A sponge" },
];

const pending = new Map();

module.exports = {
    commands:    ['riddle', 'answer'],
    description: 'Get a riddle — type .answer to reveal the answer',
    permission:  'public',
    group:       true,
    private:     true,

    run: async (sock, message, args, ctx) => {
        const { contextInfo, command } = ctx;
        const jid = message.key.remoteJid;

        if (command === 'answer') {
            const riddle = pending.get(jid);
            if (!riddle) {
                return sock.sendMessage(jid, {
                    text: `❓ No active riddle. Type \`.riddle\` to get one first!`,
                    contextInfo
                }, { quoted: message });
            }
            pending.delete(jid);
            return sock.sendMessage(jid, {
                text: `✅ *The Answer Is:*\n\n${riddle.a}`,
                contextInfo
            }, { quoted: message });
        }

        let pick;
        try {
            const res = await axios.get('https://riddles-api.vercel.app/random', { timeout: 6000 });
            if (res.data?.riddle && res.data?.answer) pick = { q: res.data.riddle, a: res.data.answer };
            else throw new Error('bad');
        } catch {
            pick = RIDDLES[Math.floor(Math.random() * RIDDLES.length)];
        }

        pending.set(jid, pick);
        setTimeout(() => pending.delete(jid), 5 * 60 * 1000);

        await sock.sendMessage(jid, {
            text: `🧩 *Riddle Time!*\n\n❓ ${pick.q}\n\n_Type \`.answer\` to reveal the answer_`,
            contextInfo
        }, { quoted: message });
    }
};

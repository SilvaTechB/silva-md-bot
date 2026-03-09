'use strict';

const axios = require('axios');

module.exports = {
    commands:    ['joke', 'jokes'],
    description: 'Get a random joke',
    usage:       '.joke [category]  — categories: programming, dark, misc, pun',
    permission:  'public',
    group:       true,
    private:     true,

    run: async (sock, message, args, ctx) => {
        const { contextInfo } = ctx;
        const jid = message.key.remoteJid;

        const validCats = ['any', 'programming', 'misc', 'dark', 'pun', 'spooky', 'christmas'];
        const cat = args[0] && validCats.includes(args[0].toLowerCase()) ? args[0] : 'Any';

        try {
            const res = await axios.get(`https://v2.jokeapi.dev/joke/${cat}`, {
                params: { blacklistFlags: 'racist,sexist' },
                timeout: 8000
            });
            const data = res.data;

            if (data.error) throw new Error(data.message || 'No joke found');

            let jokeText;
            if (data.type === 'twopart') {
                jokeText =
                    `😂 *Joke* _(${data.category})_\n\n` +
                    `❓ ${data.setup}\n\n` +
                    `💬 ${data.delivery}`;
            } else {
                jokeText =
                    `😂 *Joke* _(${data.category})_\n\n` +
                    `${data.joke}`;
            }

            await sock.sendMessage(jid, { text: jokeText, contextInfo }, { quoted: message });

        } catch (err) {
            await sock.sendMessage(jid, {
                text: `❌ Couldn't fetch a joke: ${err.message}`,
                contextInfo
            }, { quoted: message });
        }
    }
};

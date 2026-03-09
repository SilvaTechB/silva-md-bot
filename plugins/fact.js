'use strict';

const axios = require('axios');

module.exports = {
    commands:    ['fact', 'facts', 'funfact'],
    description: 'Get a random interesting fact',
    permission:  'public',
    group:       true,
    private:     true,

    run: async (sock, message, args, ctx) => {
        const { contextInfo } = ctx;
        const jid = message.key.remoteJid;

        try {
            const res = await axios.get('https://uselessfacts.jsph.pl/api/v2/facts/random', {
                params: { language: 'en' },
                timeout: 8000
            });
            const fact = res.data?.text;

            if (!fact) throw new Error('No fact returned');

            await sock.sendMessage(jid, {
                text: `🧠 *Random Fact*\n\n💡 ${fact}\n\n> _Powered by Silva MD_`,
                contextInfo
            }, { quoted: message });

        } catch {
            const fallback = [
                "Honey never spoils — edible honey has been found in 3,000-year-old Egyptian tombs.",
                "A group of flamingos is called a 'flamboyance'.",
                "Bananas are curved because they grow towards the sun.",
                "The Eiffel Tower can be 15 cm taller in summer due to metal expansion.",
                "Octopuses have three hearts and blue blood.",
                "A day on Venus is longer than a year on Venus.",
                "Crows can recognize and remember human faces.",
                "Sharks are older than trees — they've existed for over 400 million years.",
            ];
            const pick = fallback[Math.floor(Math.random() * fallback.length)];
            await sock.sendMessage(jid, {
                text: `🧠 *Random Fact*\n\n💡 ${pick}\n\n> _Powered by Silva MD_`,
                contextInfo
            }, { quoted: message });
        }
    }
};

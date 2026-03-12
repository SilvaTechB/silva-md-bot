'use strict';
const axios = require('axios');
const { fmt } = require('../lib/theme');

module.exports = {
    commands:    ['dictionary', 'wordinfo', 'fulldict'],
    description: 'Full English dictionary — definitions, phonetics, synonyms, antonyms',
    usage:       '.dict [word]',
    permission:  'public',
    group:       true,
    private:     true,

    run: async (sock, message, args, ctx) => {
        const { jid, contextInfo } = ctx;
        const reply = (text) => sock.sendMessage(jid, { text: fmt(text), contextInfo }, { quoted: message });

        const word = args.join(' ').trim();
        if (!word) return reply('❌ *Usage:* `.dict [word]`\n\nExamples:\n• `.dict serendipity`\n• `.dict beautiful`');

        try {
            const res  = await axios.get(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`, { timeout: 10000 });
            const data = res.data;

            if (!Array.isArray(data) || !data.length) return reply(`❌ No definition found for *"${word}"*`);

            const entry    = data[0];
            const phonetic = entry.phonetic || entry.phonetics?.find(p => p.text)?.text || '';

            const lines = [
                `📚 *Dictionary*`,
                ``,
                `🔤 *${entry.word}*${phonetic ? `  /${phonetic}/` : ''}`,
            ];

            const maxMeanings = 3;
            const maxDefs     = 3;

            for (const meaning of (entry.meanings || []).slice(0, maxMeanings)) {
                lines.push('', `🏷️ *${meaning.partOfSpeech}*`);

                for (const [i, def] of (meaning.definitions || []).slice(0, maxDefs).entries()) {
                    lines.push(`${i + 1}. ${def.definition}`);
                    if (def.example) lines.push(`   _"${def.example}"_`);
                }

                const syns = meaning.synonyms?.slice(0, 5);
                const ants = meaning.antonyms?.slice(0, 5);
                if (syns?.length) lines.push(`✅ Synonyms: ${syns.join(', ')}`);
                if (ants?.length) lines.push(`❌ Antonyms: ${ants.join(', ')}`);
            }

            const audioUrl = entry.phonetics?.find(p => p.audio)?.audio;
            if (audioUrl) lines.push('', `🔊 _Audio pronunciation available_`);

            return reply(lines.join('\n'));

        } catch (e) {
            if (e.response?.status === 404) return reply(`❌ Word *"${word}"* not found in dictionary.`);
            return reply(`❌ Dictionary lookup failed: ${e.message}`);
        }
    }
};

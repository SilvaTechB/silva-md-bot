'use strict';

const axios = require('axios');
const { fmt } = require('../lib/theme');

const BUILTIN_RHYMES = {
    moon:   ['June', 'tune', 'soon', 'noon', 'spoon', 'balloon', 'cartoon', 'lagoon', 'cocoon', 'monsoon'],
    day:    ['way', 'say', 'play', 'stay', 'ray', 'bay', 'hay', 'May', 'pay', 'pray'],
    love:   ['above', 'dove', 'shove', 'glove', 'of'],
    night:  ['light', 'right', 'sight', 'fight', 'bright', 'might', 'tight', 'white', 'flight', 'kite'],
    time:   ['rhyme', 'climb', 'lime', 'mime', 'prime', 'slime', 'sublime', 'dime', 'chime'],
    fire:   ['desire', 'hire', 'higher', 'inspire', 'tire', 'wire', 'admire', 'entire', 'expire'],
    rain:   ['pain', 'gain', 'main', 'plain', 'train', 'brain', 'chain', 'drain', 'Spain', 'vain'],
    star:   ['far', 'bar', 'car', 'jar', 'scar', 'guitar', 'bazaar', 'radar'],
    heart:  ['art', 'start', 'part', 'smart', 'chart', 'dart', 'cart'],
    dream:  ['team', 'beam', 'cream', 'gleam', 'stream', 'scheme', 'theme', 'extreme', 'regime'],
};

module.exports = {
    commands:    ['rhyme', 'rhymes'],
    description: 'Find words that rhyme with a given word',
    usage:       '.rhyme <word>',
    permission:  'public',
    group:       true,
    private:     true,

    run: async (sock, message, args, ctx) => {
        const { jid, contextInfo } = ctx;
        const word = args[0]?.toLowerCase().trim();

        if (!word) {
            return sock.sendMessage(jid, {
                text: fmt(
                    `🎵 *Rhyme Finder*\n\n` +
                    `Usage: \`.rhyme <word>\`\n\n` +
                    `_Examples:_\n` +
                    `• \`.rhyme moon\`\n` +
                    `• \`.rhyme love\`\n` +
                    `• \`.rhyme night\`\n\n` +
                    `_Finds words that rhyme using the Datamuse API._`
                ),
                contextInfo
            }, { quoted: message });
        }

        let rhymes = [];
        let source = 'Datamuse';

        try {
            const res = await axios.get(`https://api.datamuse.com/words?rel_rhy=${encodeURIComponent(word)}&max=20`, { timeout: 8000 });
            rhymes = res.data?.map(r => r.word).filter(Boolean) || [];
        } catch {}

        if (!rhymes.length) {
            const builtin = BUILTIN_RHYMES[word.toLowerCase()];
            if (builtin) {
                rhymes = builtin;
                source = 'Built-in';
            }
        }

        if (!rhymes.length) {
            return sock.sendMessage(jid, {
                text: fmt(`🎵 No rhymes found for *"${word}"*.\n\n_Try a simpler word like: moon, love, night, fire._`),
                contextInfo
            }, { quoted: message });
        }

        const lines = [
            `🎵 *Words that rhyme with "${word}"*`,
            '',
            rhymes.join(', '),
            '',
            `📊 *${rhymes.length} rhyme${rhymes.length !== 1 ? 's' : ''} found*`,
            `_Source: ${source}_`,
        ];

        await sock.sendMessage(jid, {
            text: fmt(lines.join('\n')),
            contextInfo
        }, { quoted: message });
    }
};

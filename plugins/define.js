'use strict';

const axios = require('axios');

module.exports = {
    commands:    ['define', 'dict', 'meaning', 'definition'],
    description: 'Look up the definition of an English word',
    usage:       '.define <word>',
    permission:  'public',
    group:       true,
    private:     true,

    run: async (sock, message, args, ctx) => {
        const { contextInfo } = ctx;
        const jid = message.key.remoteJid;

        if (!args.length) {
            return sock.sendMessage(jid, {
                text: `❌ *Usage:* \`.define <word>\`\n\n_Example:_ \`.define serendipity\``,
                contextInfo
            }, { quoted: message });
        }

        const word = args[0].toLowerCase().trim();

        try {
            const res = await axios.get(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`, {
                timeout: 8000
            });

            const entry    = res.data[0];
            const phonetic = entry.phonetic || entry.phonetics?.find(p => p.text)?.text || '';
            const meanings = entry.meanings || [];

            let text = `📖 *Definition: ${entry.word}*`;
            if (phonetic) text += `\n🔊 _${phonetic}_`;
            text += `\n`;

            for (const meaning of meanings.slice(0, 3)) {
                text += `\n*${meaning.partOfSpeech}*\n`;
                const defs = (meaning.definitions || []).slice(0, 2);
                for (let i = 0; i < defs.length; i++) {
                    text += `${i + 1}. ${defs[i].definition}\n`;
                    if (defs[i].example) text += `   _"${defs[i].example}"_\n`;
                }
                if (meaning.synonyms?.length) {
                    text += `🔁 *Synonyms:* ${meaning.synonyms.slice(0, 5).join(', ')}\n`;
                }
            }

            text += `\n> _Powered by Free Dictionary API_`;

            await sock.sendMessage(jid, { text, contextInfo }, { quoted: message });

        } catch (err) {
            const status = err.response?.status;
            if (status === 404) {
                await sock.sendMessage(jid, {
                    text: `❌ No definition found for *"${word}"*.\n\nCheck the spelling or try a different word.`,
                    contextInfo
                }, { quoted: message });
            } else {
                await sock.sendMessage(jid, {
                    text: `❌ Dictionary lookup failed: ${err.message}`,
                    contextInfo
                }, { quoted: message });
            }
        }
    }
};

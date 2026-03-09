'use strict';

const axios = require('axios');

module.exports = {
    commands:    ['translate', 'tr'],
    description: 'Translate text to another language',
    usage:       '.translate <lang> <text>  e.g. .translate fr Hello world',
    permission:  'public',
    group:       true,
    private:     true,

    run: async (sock, message, args, ctx) => {
        const { contextInfo } = ctx;
        const jid = message.key.remoteJid;

        if (args.length < 2) {
            return sock.sendMessage(jid, {
                text: `❌ *Usage:* \`.translate <lang> <text>\`\n\n*Examples:*\n• \`.translate fr Hello world\`\n• \`.translate sw Good morning\`\n• \`.translate ar How are you\`\n\n🌍 *Common codes:* fr, es, de, ar, sw, zh, ja, pt, hi, ru`,
                contextInfo
            }, { quoted: message });
        }

        const targetLang = args[0].toLowerCase();
        const text       = args.slice(1).join(' ');

        try {
            const res = await axios.get('https://api.mymemory.translated.net/get', {
                params: { q: text, langpair: `en|${targetLang}` },
                timeout: 10000
            });

            const result  = res.data;
            const translated = result?.responseData?.translatedText;

            if (!translated || result.responseStatus !== 200) {
                return sock.sendMessage(jid, {
                    text: `❌ Translation failed. Check the language code and try again.\n\n_Common codes: fr, es, de, ar, sw, zh, ja, pt, hi, ru_`,
                    contextInfo
                }, { quoted: message });
            }

            const quality = result.responseData.match;
            const qualityStr = quality != null ? ` (${Math.round(quality * 100)}% match)` : '';

            await sock.sendMessage(jid, {
                text:
                    `🌍 *Translation*${qualityStr}\n\n` +
                    `📝 *Original (en):*\n${text}\n\n` +
                    `✅ *Translated (${targetLang.toUpperCase()}):*\n${translated}`,
                contextInfo
            }, { quoted: message });

        } catch (err) {
            await sock.sendMessage(jid, {
                text: `❌ Translation error: ${err.message}`,
                contextInfo
            }, { quoted: message });
        }
    }
};

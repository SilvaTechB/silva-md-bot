'use strict';
const axios = require('axios');

const VOICES = { en:'en',fr:'fr',sw:'sw',ar:'ar',es:'es',de:'de',ja:'ja',zh:'zh-CN',hi:'hi',pt:'pt' };

module.exports = {
    commands:    ['tts', 'speak', 'voice'],
    description: 'Convert text to speech audio',
    usage:       '.tts <text>  or  .tts <lang> <text>',
    permission:  'public',
    group:       true,
    private:     true,

    run: async (sock, message, args, ctx) => {
        const { contextInfo } = ctx;
        const jid = message.key.remoteJid;
        if (!args.length) {
            return sock.sendMessage(jid, {
                text: `❌ *Usage:* \`.tts <text>\` or \`.tts <lang> <text>\`\n_Languages:_ en, fr, sw, ar, es, de, ja, zh, hi, pt`,
                contextInfo
            }, { quoted: message });
        }
        let lang = 'en', text;
        if (VOICES[args[0].toLowerCase()]) { lang = VOICES[args[0].toLowerCase()]; text = args.slice(1).join(' '); }
        else { text = args.join(' '); }
        if (!text?.trim()) return sock.sendMessage(jid, { text: `❌ Please provide text.`, contextInfo }, { quoted: message });
        if (text.length > 200) return sock.sendMessage(jid, { text: `❌ Max 200 characters.`, contextInfo }, { quoted: message });
        try {
            const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=${lang}&q=${encodeURIComponent(text)}`;
            const res    = await axios.get(ttsUrl, { responseType: 'arraybuffer', timeout: 15000, headers: { 'User-Agent': 'Mozilla/5.0' } });
            await sock.sendMessage(jid, { audio: Buffer.from(res.data), mimetype: 'audio/mpeg', ptt: true }, { quoted: message });
        } catch (err) {
            await sock.sendMessage(jid, { text: `❌ TTS failed: ${err.message}`, contextInfo }, { quoted: message });
        }
    }
};

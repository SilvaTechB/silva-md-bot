'use strict';
const axios = require('axios');

module.exports = {
    commands:    ['numberfact', 'numfact', 'number'],
    description: 'Get an interesting fact about a number',
    usage:       '.numberfact <number>  or just .numberfact for random',
    permission:  'public',
    group:       true,
    private:     true,

    run: async (sock, message, args, ctx) => {
        const { contextInfo } = ctx;
        const jid = message.key.remoteJid;
        const num = args[0] && !isNaN(parseInt(args[0])) ? parseInt(args[0]) : 'random';
        const type = args[1] || 'trivia';
        const validTypes = ['trivia', 'math', 'date', 'year'];
        const t = validTypes.includes(type) ? type : 'trivia';
        try {
            const res = await axios.get(`http://numbersapi.com/${num}/${t}`, {
                timeout: 8000,
                headers: { 'Accept': 'application/json' }
            });
            const fact = typeof res.data === 'string' ? res.data : res.data.text || String(res.data);
            await sock.sendMessage(jid, {
                text: `🔢 *Number Fact*\n\n${fact}\n\n> _Powered by NumbersAPI_`,
                contextInfo
            }, { quoted: message });
        } catch {
            await sock.sendMessage(jid, {
                text: `❌ Couldn't fetch number fact. Try: \`.numberfact 42\` or \`.numberfact 2024 year\``,
                contextInfo
            }, { quoted: message });
        }
    }
};

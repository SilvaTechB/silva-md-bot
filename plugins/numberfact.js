'use strict';
const axios = require('axios');

module.exports = {
    commands:    ['numberfact', 'numfact', 'number'],
    description: 'Get an interesting fact about a number',
    usage:       '.numberfact <number>',
    permission:  'public',
    group:       true,
    private:     true,

    run: async (sock, message, args, ctx) => {
        const { contextInfo } = ctx;
        const jid  = message.key.remoteJid;
        const num  = args[0] && !isNaN(parseInt(args[0])) ? parseInt(args[0]) : 'random';
        const type = ['trivia','math','date','year'].includes(args[1]) ? args[1] : 'trivia';
        try {
            const res  = await axios.get(`http://numbersapi.com/${num}/${type}`, { timeout: 8000 });
            const fact = typeof res.data === 'string' ? res.data : String(res.data);
            await sock.sendMessage(jid, {
                text: `🔢 *Number Fact*\n\n${fact}`,
                contextInfo
            }, { quoted: message });
        } catch {
            await sock.sendMessage(jid, { text: `❌ Couldn't fetch number fact.`, contextInfo }, { quoted: message });
        }
    }
};

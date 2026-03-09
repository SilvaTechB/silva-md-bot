'use strict';
const axios = require('axios');

module.exports = {
    commands:    ['advice', 'tip'],
    description: 'Get a random piece of advice',
    permission:  'public',
    group:       true,
    private:     true,

    run: async (sock, message, args, ctx) => {
        const { contextInfo } = ctx;
        const jid = message.key.remoteJid;
        try {
            const res = await axios.get('https://api.adviceslip.com/advice', {
                headers: { 'Accept': 'application/json' },
                timeout: 8000
            });
            const slip = res.data?.slip;
            if (!slip?.advice) throw new Error('No advice returned');
            await sock.sendMessage(jid, {
                text: `💡 *Advice #${slip.id}*\n\n"${slip.advice}"\n\n> _Powered by Silva MD_`,
                contextInfo
            }, { quoted: message });
        } catch {
            const fallbacks = [
                "Take breaks. Your brain needs rest to function well.",
                "Drink enough water today. Small habits lead to big changes.",
                "Before you speak, ask yourself: is it true, is it kind, is it necessary?",
                "Comparison is the thief of joy. Run your own race.",
                "You don't have to be perfect. You just have to keep moving.",
            ];
            const pick = fallbacks[Math.floor(Math.random() * fallbacks.length)];
            await sock.sendMessage(jid, {
                text: `💡 *Advice*\n\n"${pick}"\n\n> _Powered by Silva MD_`,
                contextInfo
            }, { quoted: message });
        }
    }
};

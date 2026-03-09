'use strict';

const axios = require('axios');

const AI_APIS = [
    q => `https://lance-frank-asta.onrender.com/api/gpt?q=${encodeURIComponent(q)}`,
    q => `https://vapis.my.id/api/openai?q=${encodeURIComponent(q)}`
];

module.exports = {
    commands:    ['ai', 'gpt', 'chatgpt'],
    description: 'Ask the AI a question',
    permission:  'public',
    group:       true,
    private:     true,
    run: async (sock, message, args, { sender, contextInfo }) => {
        const query = args.join(' ').trim();
        if (!query) {
            return sock.sendMessage(sender, {
                text: '❌ Please provide a question!\nExample: `.ai What is AI?`',
                contextInfo
            }, { quoted: message });
        }

        let response = null;
        for (const buildUrl of AI_APIS) {
            try {
                const res = await axios.get(buildUrl(query), { timeout: 15000 });
                if (res.data?.message) { response = res.data.message; break; }
            } catch (err) {
                console.error('[AI] API failed:', err.message);
            }
        }

        if (!response) response = '⚠️ Sorry, all AI servers are currently unavailable. Try again later.';

        await sock.sendMessage(sender, {
            text: `🤖 *AI Response:*\n\n${response}`,
            contextInfo
        }, { quoted: message });
    }
};

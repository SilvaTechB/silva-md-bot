// plugins/ai.js
const axios = require('axios');

module.exports = {
    name: 'ai',
    commands: ['ai', 'gpt', 'chatgpt'],
    description: 'Ask AI a question using GPT-powered APIs',
    async execute(sock, m, args, contextInfo) {
        const query = args.join(' ');
        if (!query) {
            return sock.sendMessage(m.key.remoteJid, {
                text: '❌ Please provide a question!\n\nExample: .ai What is artificial intelligence?',
                contextInfo
            }, { quoted: m });
        }

        const apis = [
            `https://lance-frank-asta.onrender.com/api/gpt?q=${encodeURIComponent(query)}`,
            `https://vapis.my.id/api/openai?q=${encodeURIComponent(query)}`
        ];

        let response = null;
        for (const url of apis) {
            try {
                const res = await axios.get(url, { timeout: 15000 });
                if (res.data && typeof res.data === 'object') {
                    response = res.data.result || res.data.answer || JSON.stringify(res.data);
                } else {
                    response = res.data;
                }
                break; // Stop after first success
            } catch (err) {
                console.error(`❌ API failed: ${url}`, err.message);
            }
        }

        if (!response) {
            response = '⚠️ Sorry, all AI servers are currently unreachable. Try again later!';
        }

        await sock.sendMessage(m.key.remoteJid, {
            text: `🤖 *AI Response:*\n\n${response}`,
            contextInfo
        }, { quoted: m });
    }
};

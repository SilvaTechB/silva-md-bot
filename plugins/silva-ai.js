const axios = require('axios');

module.exports = {
    commands: ['ai', 'gpt', 'chatgpt'],
    handler: async ({ sock, m, sender, args = [], contextInfo = {} }) => {
        try {
            const query = args.length ? args.join(' ') : null;

            if (!query) {
                return await sock.sendMessage(sender, {
                    text: '❌ Please provide a question!\n\nExample: `.ai What is artificial intelligence?`',
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
                    if (res.data?.message) {  // ✅ Get only message field
                        response = res.data.message;
                        break;
                    }
                } catch (err) {
                    console.error(`❌ API failed: ${url}`, err.message);
                }
            }

            if (!response) {
                response = '⚠️ Sorry, all AI servers are currently down. Try again later!';
            }

            await sock.sendMessage(sender, {
                text: `🤖 *AI Response:*\n\n${response}`,
                contextInfo
            }, { quoted: m });

        } catch (error) {
            console.error('❌ AI Plugin Error:', error.message);
            await sock.sendMessage(sender, {
                text: '⚠️ Failed to fetch AI response. Please check logs.',
                contextInfo
            }, { quoted: m });
        }
    }
};

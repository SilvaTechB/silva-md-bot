const axios = require('axios');

const handler = {
    help: ['ai'],
    tags: ['ai', 'utility'],
    command: /^(ai)$/i,
    group: false,
    admin: false,
    botAdmin: false,
    owner: false,

    execute: async ({ jid, sock, message, args }) => {
        const sender = message.key.participant || message.key.remoteJid;
        const contextInfo = ctx(sender, "Silva MD AI Hub 🤖");
        const query = args.length ? args.join(' ') : null;

        if (!query) {
            return await sock.sendMessage(
                jid,
                {
                    text: '❌ Please provide a question!\n\nExample: `.ai What is artificial intelligence?`',
                    contextInfo
                },
                { quoted: message }
            );
        }

        const apis = [
            `https://lance-frank-asta.onrender.com/api/gpt?q=${encodeURIComponent(query)}`,
            `https://vapis.my.id/api/openai?q=${encodeURIComponent(query)}`
        ];

        let response = null;

        for (const url of apis) {
            try {
                const res = await axios.get(url, { timeout: 15000 });
                if (res.data?.message) {
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

        await sock.sendMessage(
            jid,
            {
                text: `🤖 *AI Response:*\n\n${response}`,
                contextInfo
            },
            { quoted: message }
        );
    }
};

module.exports = { handler };

// 🧠 Shared contextInfo builder
function ctx(sender, name) {
    return {
        mentionedJid: [sender],
        forwardingScore: 999,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
            newsletterJid: "120363200367779016@newsletter",
            newsletterName: name,
            serverMessageId: Math.floor(Math.random() * 1000)
        }
    };
}
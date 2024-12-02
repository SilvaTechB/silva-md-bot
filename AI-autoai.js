const axios = require('axios');

let handler = async (m, { conn, text, usedPrefix, command }) => {
    // Initialize sessionAI object
    conn.sessionAI = conn.sessionAI || {};

    if (!text) throw `🚩 Usage: *${usedPrefix + command} enable/disable*`;

    if (text.toLowerCase() === "enable") {
        conn.sessionAI[m.sender] = { sessionChat: [] };
        m.reply("✅ Silva MD session has been successfully enabled!");
    } else if (text.toLowerCase() === "disable") {
        delete conn.sessionAI[m.sender];
        m.reply("❌ Silva MD session has been successfully disabled!");
    } else {
        throw `🚩 Invalid input! Use *${usedPrefix + command} enable* or *${usedPrefix + command} disable*.`;
    }
};

handler.before = async (m, { conn }) => {
    conn.sessionAI = conn.sessionAI || {};

    // Ignore bot messages, empty messages, or messages with command prefixes
    if (m.isBaileys && m.fromMe) return;
    if (!m.text) return;
    if (!conn.sessionAI[m.sender]) return;
    if ([".", "#", "!", "/", "\\"].some(prefix => m.text.startsWith(prefix))) return;

    if (conn.sessionAI[m.sender] && m.text) {
        const previousMessages = conn.sessionAI[m.sender].sessionChat || [];

        // Construct conversation history
        const messages = [
            { role: "system", content: "You are a helpful assistant." },
            ...previousMessages.map((msg, i) => ({
                role: i % 2 === 0 ? 'user' : 'assistant',
                content: msg
            })),
            { role: "user", content: m.text }
        ];

        try {
            // Function to interact with OpenAI ChatGPT
            const chat = async function(messages) {
                try {
                    const response = await axios.post(
                        'https://api.openai.com/v1/chat/completions',
                        {
                            model: "gpt-3.5-turbo",
                            messages: messages,
                            temperature: 0.7
                        },
                        {
                            headers: {
                                "Content-Type": "application/json",
                                "Authorization": `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` // Replace with your OpenAI API key
                            }
                        }
                    );
                    return response.data.choices[0].message.content;
                } catch (error) {
                    console.error(error.response ? error.response.data : error.message);
                    throw new Error("Failed to fetch data from OpenAI API.");
                }
            };

            // Fetch response from ChatGPT
            let res = await chat(messages);
            if (res) {
                await m.reply(res);

                // Update session chat with user input and assistant's response
                conn.sessionAI[m.sender].sessionChat = [
                    ...conn.sessionAI[m.sender].sessionChat,
                    m.text,
                    res
                ];
            } else {
                m.reply("⚠️ An error occurred while fetching data from ChatGPT.");
            }
        } catch (e) {
            console.error(e);
            m.reply("❌ An unexpected error occurred. Please try again later.");
        }
    }
};

// Command metadata
handler.command = ['autoai'];
handler.tags = ['main'];
handler.help = ['autoai'].map(cmd => `${cmd} enable/disable`);
handler.limit = true;

module.exports = handler;

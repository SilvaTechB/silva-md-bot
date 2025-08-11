// plugins/hello.js
const { safeSend } = require('../utils/safeSend');

module.exports = {
    name: 'hello',
    description: 'Test safeSend by replying with a friendly greeting',
    group: true,
    private: true,
    run: async (sock, message, args, groupMetadata) => {
        const jid = message.key.remoteJid;
        // Reply and quote the incoming message for context
        await safeSend(sock, jid, { text: 'Hello! 👋' }, { quoted: message });
    },

    // Optional: non-command trigger example (not required for this test)
    // onMessage: async (sock, message, text, groupMetadata) => {
    //     if (/^hi|hello$/i.test(text.trim())) {
    //         const jid = message.key.remoteJid;
    //         await safeSend(sock, jid, { text: 'Hey there! ✨' }, { quoted: message });
    //     }
    // }
};

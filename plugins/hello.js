// plugins/hello.js
module.exports = {
    name: 'hello',
    description: 'Responds with a greeting',
    group: true,
    private: true,
    run: async (sock, message, args, groupMetadata) => {
        const chatId = message.key.remoteJid;
        await sock.sendMessage(chatId, { text: 'Hello! 👋' });
    }
};

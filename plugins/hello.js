module.exports = {
    name: 'hello',
    description: 'hello Test command',
    usage: '.hello',
    group: true,
    private: true,
    run: async (sock, message, args, { jid, safeSend }) => {
        await safeSend(sock, jid, { text: `✅ hello command received! Args: ${args.join(', ')}` }, { quoted: message });
    }
};

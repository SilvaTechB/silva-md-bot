// plugins/hello.js
const { safeSend } = require('../utils/safeSend');

module.exports = {
    name: 'hello',
    description: 'Test safeSend with a friendly greeting in groups and privates',
    group: true,
    private: true,

    /**
     * Command handler for `.hello`
     */
    run: async (sock, message, args, groupMetadata) => {
        const jid = message.key.remoteJid;

        try {
            await safeSend(
                sock,
                jid,
                { text: 'Hello! 👋 This is a safeSend test — it works in both group and private chats.' },
                { quoted: message }
            );
            console.log(`[HELLO] Sent hello to ${jid}`);
        } catch (err) {
            console.error(`[HELLO] Failed to send hello to ${jid}:`, err);
        }
    },

    /**
     * Optional: non-command trigger, e.g. if someone just says "hi"
     * Uncomment if you want passive greeting detection.
     */
    // onMessage: async (sock, message, text, groupMetadata) => {
    //     if (/^(hi|hello)$/i.test(text.trim())) {
    //         const jid = message.key.remoteJid;
    //         try {
    //             await safeSend(sock, jid, { text: 'Hey there! ✨' }, { quoted: message });
    //         } catch (err) {
    //             console.error(`[HELLO-trigger] Failed to greet ${jid}:`, err);
    //         }
    //     }
    // }
};

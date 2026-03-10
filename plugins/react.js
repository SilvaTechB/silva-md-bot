'use strict';

module.exports = {
    commands:    ['react', 'reaction', 'emoji'],
    description: 'React to a message with an emoji',
    usage:       '.react ❤️  (reply to a message)',
    permission:  'public',
    group:       true,
    private:     true,

    run: async (sock, message, args, ctx) => {
        const { jid, contextInfo } = ctx;

        const emoji = args[0]?.trim();
        if (!emoji) {
            return sock.sendMessage(jid, {
                text: '❌ Provide an emoji to react with.\n\nExample: `.react ❤️`',
                contextInfo
            }, { quoted: message });
        }

        // Target: quoted message if present, otherwise the command message itself
        const quotedKey = message.message?.extendedTextMessage?.contextInfo?.stanzaId
            ? {
                remoteJid: jid,
                fromMe:    message.message.extendedTextMessage.contextInfo.participant === sock.user?.id,
                id:        message.message.extendedTextMessage.contextInfo.stanzaId,
                participant: message.message.extendedTextMessage.contextInfo.participant
            }
            : message.key;

        await sock.sendMessage(jid, {
            react: { text: emoji, key: quotedKey }
        });
    }
};

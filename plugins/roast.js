'use strict';

const roasts = [
    "You're the human equivalent of a participation trophy.",
    "I'd roast you, but my mom said I'm not allowed to burn trash.",
    "You have something on your chin... no, the third one.",
    "I'd explain it to you, but I don't have crayons.",
    "You're like a cloud. When you disappear, it's a beautiful day.",
    "I'd agree with you but then we'd both be wrong.",
    "You're proof that evolution can go in reverse.",
    "Your secrets are safe with me. I never even listen when you talk.",
    "If laughter is the best medicine, your face must be curing diseases.",
    "You're not stupid — you just have bad luck thinking."
];

module.exports = {
    commands:    ['roast'],
    description: 'Roast someone (all in good fun!)',
    permission:  'public',
    group:       true,
    private:     true,
    run: async (sock, message, args, { sender, groupId, contextInfo }) => {
        const chatId  = groupId || sender;
        const mention = message.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
        const target  = mention ? `@${mention.split('@')[0]}` : (args[0] ? args[0] : 'you');
        const r       = roasts[Math.floor(Math.random() * roasts.length)];
        await sock.sendMessage(chatId, {
            text: `🔥 *Roasting ${target}*\n\n${r}\n\n_😂 All jokes, no harm! — Silva MD_`,
            mentions: mention ? [mention] : [],
            contextInfo
        }, { quoted: message });
    }
};

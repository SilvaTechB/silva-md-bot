'use strict';

module.exports = {
    commands:    ['ship', 'couple', 'love'],
    description: 'Calculate love compatibility between two people',
    permission:  'public',
    group:       true,
    private:     true,
    run: async (sock, message, args, { sender, groupId, contextInfo }) => {
        const chatId = groupId || sender;
        const parts  = args.join(' ').split(/\s+and\s+|\s*,\s*|\s+&\s+/i);
        let p1 = parts[0]?.trim();
        let p2 = parts[1]?.trim();

        const mentions = message.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
        if (mentions.length >= 2) {
            p1 = `@${mentions[0].split('@')[0]}`;
            p2 = `@${mentions[1].split('@')[0]}`;
        } else if (!p1 || !p2) {
            return sock.sendMessage(chatId, {
                text: '💕 Usage: .ship <name1> and <name2>\nOr mention two people: .ship @person1 @person2',
                contextInfo
            }, { quoted: message });
        }

        const seed = (p1 + p2).split('').reduce((a, c) => a + c.charCodeAt(0), 0);
        const pct  = seed % 101;
        const bar  = '💗'.repeat(Math.floor(pct / 10)) + '🖤'.repeat(10 - Math.floor(pct / 10));
        const msg  = pct >= 80 ? '💍 Perfect match! Get married already!' :
                     pct >= 60 ? '💕 Great chemistry!' :
                     pct >= 40 ? '😊 Pretty good!' :
                     pct >= 20 ? '🤔 Could work with effort.' : '💔 Not a great match.';

        await sock.sendMessage(chatId, {
            text: `💕 *Ship Results*\n\n👫 ${p1} + ${p2}\n\n${bar}\n❤️ *${pct}% Compatible*\n\n${msg}`,
            mentions: mentions,
            contextInfo
        }, { quoted: message });
    }
};

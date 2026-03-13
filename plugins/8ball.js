'use strict';

const responses = [
    '✅ It is certain.',
    '✅ Without a doubt.',
    '✅ Yes, definitely.',
    '✅ Most likely.',
    '✅ Signs point to yes.',
    '🔮 Ask again later.',
    '🔮 Cannot predict now.',
    '🔮 Concentrate and ask again.',
    '❌ Don\'t count on it.',
    '❌ My reply is no.',
    '❌ My sources say no.',
    '❌ Very doubtful.',
    '❌ Outlook not so good.'
];

module.exports = {
    commands:    ['8ball', 'ask', 'magic8'],
    description: 'Ask the magic 8-ball a yes/no question',
    permission:  'public',
    group:       true,
    private:     true,
    run: async (sock, message, args, { sender, groupId, contextInfo }) => {
        const question = args.join(' ');
        const chatId   = groupId || sender;
        if (!question) {
            return sock.sendMessage(chatId, {
                text: '🎱 Ask the magic 8-ball a question!\nExample: .8ball Will I be rich?',
                contextInfo
            }, { quoted: message });
        }
        const answer = responses[Math.floor(Math.random() * responses.length)];
        await sock.sendMessage(chatId, {
            text: `🎱 *Magic 8-Ball*\n\n❓ ${question}\n\n${answer}`,
            contextInfo
        }, { quoted: message });
    }
};

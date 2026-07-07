'use strict';

const truths = [
    "What's the most embarrassing thing you've ever done?",
    "What's the biggest lie you've ever told?",
    "Who was your first crush?",
    "What's one secret you've never told anyone?",
    "What's the most childish thing you still do?",
    "What's your biggest fear?",
    "Have you ever cheated on a test?",
    "What's the weirdest dream you've ever had?",
    "What's the most embarrassing thing in your search history?",
    "Who here would you most like to go on a date with?"
];

const dares = [
    "Send a voice note singing your favorite song 🎵",
    "Change your profile picture to a funny face for 1 hour 😄",
    "Text your crush 'I like you' and show us the reply",
    "Do 20 push-ups right now 💪",
    "Send a screenshot of your most recent conversation",
    "Send a selfie with a funny face 🤪",
    "Write 'I am a potato 🥔' in your status for 10 minutes",
    "Send a voice message saying 'I love Silva MD Bot'",
    "Call someone and sing happy birthday",
    "Let the group rename you for the next 30 minutes"
];

module.exports = {
    commands:    ['truth', 'dare', 'tod'],
    description: 'Truth or Dare game',
    permission:  'public',
    group:       true,
    private:     true,
    run: async (sock, message, args, { sender, groupId, prefix, contextInfo }) => {
        const cmd    = message.body?.split(' ')[0]?.replace(prefix, '').toLowerCase();
        const isGroup = !!groupId;
        const chatId  = groupId || sender;
        if (cmd === 'truth') {
            const q = truths[Math.floor(Math.random() * truths.length)];
            await sock.sendMessage(chatId, { text: `🔍 *TRUTH*\n\n${q}\n\n_Be honest! 😇_`, contextInfo }, { quoted: message });
        } else if (cmd === 'dare') {
            const d = dares[Math.floor(Math.random() * dares.length)];
            await sock.sendMessage(chatId, { text: `🎯 *DARE*\n\n${d}\n\n_You must do it! 😈_`, contextInfo }, { quoted: message });
        } else {
            const rand = Math.random() < 0.5;
            if (rand) {
                const q = truths[Math.floor(Math.random() * truths.length)];
                await sock.sendMessage(chatId, { text: `🎲 *TRUTH or DARE → TRUTH*\n\n${q}`, contextInfo }, { quoted: message });
            } else {
                const d = dares[Math.floor(Math.random() * dares.length)];
                await sock.sendMessage(chatId, { text: `🎲 *TRUTH or DARE → DARE*\n\n${d}`, contextInfo }, { quoted: message });
            }
        }
    }
};

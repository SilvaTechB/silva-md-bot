'use strict';

const COMPLIMENTS = [
    "You make the world a better place just by being in it. 🌟",
    "Your smile could light up the darkest room. ✨",
    "You have an incredible ability to make everyone feel welcome.",
    "Your kindness is a rare and beautiful gift to the world. 🎁",
    "You are more resilient than you give yourself credit for. 💪",
    "The way you carry yourself inspires people around you.",
    "Your creativity is genuinely impressive. 🎨",
    "You handle challenges with such grace and strength.",
    "People are lucky to have you in their lives. 🍀",
    "Your sense of humor brings so much joy to others. 😄",
    "You have a heart of gold. 💛",
    "You're doing better than you think. Keep going!",
    "Your intelligence and thoughtfulness are truly remarkable.",
    "You make hard things look easy — that's a real talent.",
    "Being around you feels like a breath of fresh air. 🌬️",
    "You bring out the best in the people around you. 🌸",
    "Your dedication and work ethic are truly admirable. 🏆",
    "You have a beautiful mind and an even more beautiful soul.",
    "The world is genuinely better with you in it. 🌍",
    "You are exactly who you need to be. 🔥",
];

module.exports = {
    commands:    ['compliment', 'comp', 'praise'],
    description: 'Send a random compliment to brighten someone\'s day',
    usage:       '.compliment [@mention optional]',
    permission:  'public',
    group:       true,
    private:     true,

    run: async (sock, message, args, ctx) => {
        const { contextInfo } = ctx;
        const jid  = message.key.remoteJid;
        const pick = COMPLIMENTS[Math.floor(Math.random() * COMPLIMENTS.length)];

        const mentioned = message.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
        const target = mentioned.length
            ? `@${mentioned[0].split('@')[0]}, ${pick.charAt(0).toLowerCase() + pick.slice(1)}`
            : pick;

        await sock.sendMessage(jid, {
            text: `💐 *Compliment*\n\n${target}`,
            mentions: mentioned,
            contextInfo
        }, { quoted: message });
    }
};

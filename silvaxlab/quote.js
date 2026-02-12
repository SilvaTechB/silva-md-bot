const config = require('../config')

const quotes = {
    motivation: [
        "The only way to do great work is to love what you do. — Steve Jobs",
        "Success is not final, failure is not fatal: it is the courage to continue that counts. — Winston Churchill",
        "Believe you can and you're halfway there. — Theodore Roosevelt",
        "The future belongs to those who believe in the beauty of their dreams. — Eleanor Roosevelt",
        "It does not matter how slowly you go as long as you do not stop. — Confucius",
        "Hardships often prepare ordinary people for an extraordinary destiny. — C.S. Lewis",
        "Your limitation—it's only your imagination.",
        "Push yourself, because no one else is going to do it for you.",
        "Dream it. Wish it. Do it.",
        "Great things never come from comfort zones."
    ],
    love: [
        "The best thing to hold onto in life is each other. — Audrey Hepburn",
        "Love is not about how many days, months, or years you've been together. It's about how much you love each other every day.",
        "In all the world, there is no heart for me like yours. — Maya Angelou",
        "You know you're in love when you can't fall asleep because reality is finally better than your dreams. — Dr. Seuss",
        "Love is composed of a single soul inhabiting two bodies. — Aristotle"
    ],
    funny: [
        "I'm not lazy, I'm on energy saving mode.",
        "I don't need a hair stylist, my pillow gives me a new hairstyle every morning.",
        "Common sense is like deodorant. The people who need it most never use it.",
        "Life is short. Smile while you still have teeth.",
        "I'm not arguing, I'm just explaining why I'm right.",
        "My bed is a magical place where I suddenly remember everything I forgot to do.",
        "I followed my heart and it led me to the fridge."
    ],
    wisdom: [
        "The only true wisdom is in knowing you know nothing. — Socrates",
        "In the middle of difficulty lies opportunity. — Albert Einstein",
        "Knowledge speaks, but wisdom listens. — Jimi Hendrix",
        "The mind is everything. What you think you become. — Buddha",
        "An unexamined life is not worth living. — Socrates"
    ],
    islamic: [
        "Verily, with hardship comes ease. — Quran 94:6",
        "Allah does not burden a soul beyond that it can bear. — Quran 2:286",
        "And He found you lost and guided you. — Quran 93:7",
        "So remember Me; I will remember you. — Quran 2:152",
        "Indeed, Allah is with the patient. — Quran 2:153"
    ]
}

const handler = {
    help: ['quote', 'quotes', 'motivation'],
    tags: ['fun'],
    command: /^(quote|quotes|motivation)$/i,
    group: false,
    admin: false,
    botAdmin: false,
    owner: false,

    execute: async ({ jid, sock, message, args }) => {
        try {
            const sender = message.key.participant || message.key.remoteJid
            const category = args[0]?.toLowerCase() || 'random'

            let selectedQuote = ''

            if (category === 'random' || !quotes[category]) {
                const allCategories = Object.keys(quotes)
                const randomCat = allCategories[Math.floor(Math.random() * allCategories.length)]
                const catQuotes = quotes[randomCat]
                selectedQuote = catQuotes[Math.floor(Math.random() * catQuotes.length)]
            } else {
                const catQuotes = quotes[category]
                selectedQuote = catQuotes[Math.floor(Math.random() * catQuotes.length)]
            }

            const categories = Object.keys(quotes).join(', ')

            await sock.sendMessage(jid, {
                text: `╭━━━━━━━━━━━━━━━━━━━━╮
┃   💭 DAILY QUOTE     ┃
╰━━━━━━━━━━━━━━━━━━━━╯

✨ _${selectedQuote}_

📂 *Categories:* ${categories}
💡 *Usage:* ${config.PREFIX}quote <category>

_Silva MD Bot_`,
                contextInfo: {
                    mentionedJid: [sender],
                    forwardingScore: 999,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: '120363200367779016@newsletter',
                        newsletterName: 'SILVA MD • QUOTES',
                        serverMessageId: Math.floor(Math.random() * 1000)
                    }
                }
            }, { quoted: message })

        } catch (err) {
            await sock.sendMessage(jid, {
                text: `❌ Error: ${err.message}`
            }, { quoted: message })
        }
    }
}

module.exports = { handler }

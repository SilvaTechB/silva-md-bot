const config = require('../config')

const quotes = [
    { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
    { text: "Innovation distinguishes between a leader and a follower.", author: "Steve Jobs" },
    { text: "Life is what happens when you're busy making other plans.", author: "John Lennon" },
    { text: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt" },
    { text: "It is during our darkest moments that we must focus to see the light.", author: "Aristotle" },
    { text: "The only thing we have to fear is fear itself.", author: "Franklin D. Roosevelt" },
    { text: "In the middle of every difficulty lies opportunity.", author: "Albert Einstein" },
    { text: "Be the change you wish to see in the world.", author: "Mahatma Gandhi" },
    { text: "Success is not final, failure is not fatal. It is the courage to continue that counts.", author: "Winston Churchill" },
    { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
    { text: "The best time to plant a tree was 20 years ago. The second best time is now.", author: "Chinese Proverb" },
    { text: "Your time is limited, don't waste it living someone else's life.", author: "Steve Jobs" },
    { text: "If you want to achieve greatness stop asking for permission.", author: "Anonymous" },
    { text: "Things work out best for those who make the best of how things work out.", author: "John Wooden" },
    { text: "To live a creative life, we must lose our fear of being wrong.", author: "Anonymous" },
    { text: "The only impossible journey is the one you never begin.", author: "Tony Robbins" },
    { text: "I have not failed. I've just found 10,000 ways that won't work.", author: "Thomas Edison" },
    { text: "A person who never made a mistake never tried anything new.", author: "Albert Einstein" },
    { text: "The mind is everything. What you think you become.", author: "Buddha" },
    { text: "Strive not to be a success, but rather to be of value.", author: "Albert Einstein" },
    { text: "Two roads diverged in a wood, and I took the one less traveled by, and that has made all the difference.", author: "Robert Frost" },
    { text: "Do what you can, with what you have, where you are.", author: "Theodore Roosevelt" },
    { text: "The best revenge is massive success.", author: "Frank Sinatra" },
    { text: "People who are crazy enough to think they can change the world, are the ones who do.", author: "Rob Siltanen" },
    { text: "Whether you think you can or you think you can't, you're right.", author: "Henry Ford" }
]

const handler = {
    help: ['inspire', 'motivation', 'quoteme'],
    tags: ['fun'],
    command: /^(inspire|motivation|quoteme|motivate)$/i,
    group: false,
    admin: false,
    botAdmin: false,
    owner: false,

    execute: async ({ jid, sock, message }) => {
        try {
            const quote = quotes[Math.floor(Math.random() * quotes.length)]

            await sock.sendMessage(jid, {
                text: `╭━━━━━━━━━━━━━━━━━━━━╮
┃   💫 INSPIRATION    ┃
╰━━━━━━━━━━━━━━━━━━━━╯

_"${quote.text}"_

— *${quote.author}*

✨ _Stay motivated!_
_Type ${config.PREFIX}inspire for more!_`,
                contextInfo: {
                    forwardingScore: 999,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: '120363200367779016@newsletter',
                        newsletterName: 'SILVA MD QUOTES 💫',
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

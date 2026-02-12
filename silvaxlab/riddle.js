const config = require('../config')

const riddles = [
    { question: "I have cities, but no houses live there. I have mountains, but no trees grow there. I have water, but no fish swim there. What am I?", answer: "A map" },
    { question: "What has keys but no locks?", answer: "A piano" },
    { question: "What has a head and a tail but no body?", answer: "A coin" },
    { question: "I speak without a mouth and hear without ears. I have no body, but I come alive with the wind. What am I?", answer: "An echo" },
    { question: "What can you break without touching it?", answer: "A promise" },
    { question: "The more you take, the more you leave behind. What am I?", answer: "Footsteps" },
    { question: "What gets wetter the more it dries?", answer: "A towel" },
    { question: "I have hands but can't clap. What am I?", answer: "A clock" },
    { question: "What has many teeth but cannot bite?", answer: "A comb" },
    { question: "What goes up but never comes down?", answer: "Your age" },
    { question: "What can travel around the world while staying in a corner?", answer: "A stamp" },
    { question: "What has legs but doesn't walk?", answer: "A table" },
    { question: "What can fill a room but takes up no space?", answer: "Light" },
    { question: "What is always in front of you but can't be seen?", answer: "The future" },
    { question: "What has one eye but can't see?", answer: "A needle" },
    { question: "I'm tall when I'm young and short when I'm old. What am I?", answer: "A candle" },
    { question: "What month of the year has 28 days?", answer: "All of them" },
    { question: "What has words but never speaks?", answer: "A book" },
    { question: "What is full of holes but still holds water?", answer: "A sponge" },
    { question: "What can you catch but not throw?", answer: "A cold" }
]

const handler = {
    help: ['riddle'],
    tags: ['fun', 'game'],
    command: /^(riddle|riddles|puzzle)$/i,
    group: false,
    admin: false,
    botAdmin: false,
    owner: false,

    execute: async ({ jid, sock, message }) => {
        try {
            const riddle = riddles[Math.floor(Math.random() * riddles.length)]

            await sock.sendMessage(jid, {
                text: `╭━━━━━━━━━━━━━━━━━━━━╮
┃   🧩 RIDDLE TIME    ┃
╰━━━━━━━━━━━━━━━━━━━━╯

🤔 *${riddle.question}*

_Think about it..._
_Reply with your answer!_

||💡 Answer: ${riddle.answer}||

_Tap the hidden text to reveal!_
_Type ${config.PREFIX}riddle for another!_`,
                contextInfo: {
                    forwardingScore: 999,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: '120363200367779016@newsletter',
                        newsletterName: 'SILVA MD GAMES 🎮',
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

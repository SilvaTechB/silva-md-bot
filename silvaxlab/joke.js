const config = require('../config')

const jokes = [
    { setup: "Why don't scientists trust atoms?", punchline: "Because they make up everything!" },
    { setup: "Why did the scarecrow win an award?", punchline: "Because he was outstanding in his field!" },
    { setup: "Why don't eggs tell jokes?", punchline: "They'd crack each other up!" },
    { setup: "What do you call a fake noodle?", punchline: "An impasta!" },
    { setup: "Why did the math book look so sad?", punchline: "Because it had too many problems!" },
    { setup: "What do you call a bear with no teeth?", punchline: "A gummy bear!" },
    { setup: "Why can't you give Elsa a balloon?", punchline: "Because she will let it go!" },
    { setup: "What do you call a sleeping dinosaur?", punchline: "A dino-snore!" },
    { setup: "Why did the bicycle fall over?", punchline: "Because it was two-tired!" },
    { setup: "What do you call a dog that does magic?", punchline: "A Labracadabrador!" },
    { setup: "Why did the golfer bring two pairs of pants?", punchline: "In case he got a hole in one!" },
    { setup: "What do you call a pile of cats?", punchline: "A meowtain!" },
    { setup: "Why do cows have hooves instead of feet?", punchline: "Because they lactose!" },
    { setup: "What did the ocean say to the beach?", punchline: "Nothing, it just waved!" },
    { setup: "Why don't skeletons fight each other?", punchline: "They don't have the guts!" },
    { setup: "What do you call a can opener that doesn't work?", punchline: "A can't opener!" },
    { setup: "Why did the tomato turn red?", punchline: "Because it saw the salad dressing!" },
    { setup: "What did one wall say to the other wall?", punchline: "I'll meet you at the corner!" },
    { setup: "Why did the student eat his homework?", punchline: "Because the teacher told him it was a piece of cake!" },
    { setup: "What do you call a fish without eyes?", punchline: "Fsh!" },
    { setup: "Why do programmers prefer dark mode?", punchline: "Because light attracts bugs!" },
    { setup: "Why was the computer cold?", punchline: "It left its Windows open!" },
    { setup: "What's a computer's least favorite food?", punchline: "Spam!" },
    { setup: "Why did the developer go broke?", punchline: "Because he used up all his cache!" },
    { setup: "Why do Java developers wear glasses?", punchline: "Because they don't C#!" },
    { setup: "What's a pirate's favorite programming language?", punchline: "R!" },
    { setup: "How does a penguin build its house?", punchline: "Igloos it together!" },
    { setup: "What did the janitor say when he jumped out of the closet?", punchline: "Supplies!" },
    { setup: "Why don't some couples go to the gym?", punchline: "Because some relationships don't work out!" },
    { setup: "What do you call cheese that isn't yours?", punchline: "Nacho cheese!" }
]

const handler = {
    help: ['joke', 'jokes'],
    tags: ['fun'],
    command: /^(joke|jokes|funny)$/i,
    group: false,
    admin: false,
    botAdmin: false,
    owner: false,

    execute: async ({ jid, sock, message }) => {
        try {
            const joke = jokes[Math.floor(Math.random() * jokes.length)]

            await sock.sendMessage(jid, {
                text: `╭━━━━━━━━━━━━━━━━━━━━╮
┃   😂 JOKE TIME      ┃
╰━━━━━━━━━━━━━━━━━━━━╯

❓ ${joke.setup}

🤣 ${joke.punchline}

_Want more? Type ${config.PREFIX}joke again!_`,
                contextInfo: {
                    forwardingScore: 999,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: '120363200367779016@newsletter',
                        newsletterName: 'SILVA MD FUN 😂',
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

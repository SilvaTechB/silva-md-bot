const config = require('../config')

const facts = [
    "Honey never spoils. Archaeologists have found 3000-year-old honey in Egyptian tombs that was still edible.",
    "Octopuses have three hearts and blue blood.",
    "A group of flamingos is called a 'flamboyance'.",
    "The shortest war in history was between Britain and Zanzibar on August 27, 1896. Zanzibar surrendered after 38 minutes.",
    "A bolt of lightning is five times hotter than the surface of the sun.",
    "Bananas are berries, but strawberries aren't.",
    "The longest hiccuping spree lasted 68 years.",
    "There are more possible chess games than atoms in the observable universe.",
    "Cows have best friends and get stressed when separated.",
    "The inventor of the Pringles can is buried in one.",
    "A day on Venus is longer than a year on Venus.",
    "Sharks are older than trees. Sharks have been around for about 400 million years, while trees have been around for 350 million years.",
    "The average person walks about 100,000 miles in their lifetime - that's like walking around the world 4 times.",
    "Elephants are the only animals that can't jump.",
    "A snail can sleep for three years.",
    "The human brain uses about 20% of the body's energy.",
    "Your nose can remember 50,000 different scents.",
    "It takes a photon 40,000 years to travel from the core of the sun to its surface, but only 8 minutes to travel the rest of the way to Earth.",
    "There are more stars in the universe than grains of sand on all of Earth's beaches.",
    "The total weight of all ants on Earth is roughly equal to the total weight of all humans.",
    "An average cloud weighs about 1.1 million pounds.",
    "The heart of a blue whale is so big that a small child could swim through its arteries.",
    "Humans share 60% of their DNA with bananas.",
    "A group of owls is called a parliament.",
    "The fingerprints of a koala are virtually indistinguishable from those of a human."
]

const handler = {
    help: ['fact', 'facts', 'didyouknow'],
    tags: ['fun'],
    command: /^(fact|facts|didyouknow|dyk)$/i,
    group: false,
    admin: false,
    botAdmin: false,
    owner: false,

    execute: async ({ jid, sock, message }) => {
        try {
            const fact = facts[Math.floor(Math.random() * facts.length)]

            await sock.sendMessage(jid, {
                text: `╭━━━━━━━━━━━━━━━━━━━━╮
┃   🧠 DID YOU KNOW?  ┃
╰━━━━━━━━━━━━━━━━━━━━╯

📚 ${fact}

_Type ${config.PREFIX}fact for another!_`,
                contextInfo: {
                    forwardingScore: 999,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: '120363200367779016@newsletter',
                        newsletterName: 'SILVA MD FACTS 🧠',
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

const config = require('../config')

const truths = [
    "What's the most embarrassing thing you've done in public?",
    "What's your biggest fear?",
    "What's the last lie you told?",
    "What's your most annoying habit?",
    "Have you ever cheated on a test?",
    "What's the worst thing you've ever said to someone?",
    "What secret are you keeping from your best friend?",
    "What's the most childish thing you still do?",
    "Have you ever pretended to be sick to skip school/work?",
    "What's the most embarrassing song on your playlist?",
    "Have you ever stalked someone on social media?",
    "What's the biggest misconception about you?",
    "What's the worst date you've been on?",
    "Have you ever been caught talking to yourself?",
    "What's the weirdest dream you've ever had?",
    "What's the most ridiculous thing you've cried over?",
    "Have you ever re-gifted a present?",
    "What's the longest you've gone without showering?",
    "What's the worst food you've pretended to like?",
    "Have you ever read someone's messages without permission?",
    "What was your most embarrassing moment in school?",
    "Have you ever lied about your age?",
    "What's the dumbest thing you've ever done for attention?",
    "What's your guilty pleasure?",
    "Have you ever broken something and blamed someone else?",
    "What's the worst advice you've ever given?",
    "Have you ever pretended to like someone you didn't?",
    "What's the most embarrassing thing your parents caught you doing?",
    "What's the biggest risk you've ever taken?",
    "What would you do if you were invisible for a day?"
]

const dares = [
    "Send a voice note singing your favorite song",
    "Change your profile picture to a funny face for 1 hour",
    "Send 'I love you' to the 5th person in your contacts",
    "Post a story saying 'I'm a potato'",
    "Type the next 3 messages with your eyes closed",
    "Send a voice note doing your best animal impression",
    "Let someone else type your next message",
    "Send a selfie right now, no filter",
    "Share the last photo in your gallery",
    "Text your crush and screenshot the response",
    "Put your status as 'I eat soap' for 30 minutes",
    "Record yourself doing 10 jumping jacks and send it",
    "Send a paragraph to your ex saying you miss them",
    "Share your screen time report",
    "Send a voice note speaking in a different accent",
    "Change your name in this group to 'Drama Queen' for 1 hour",
    "Send the 3rd photo in your gallery without looking",
    "Send a voice note laughing for 30 seconds straight",
    "Text someone random 'We need to talk' and screenshot",
    "Share the most embarrassing photo in your gallery"
]

const handler = {
    help: ['truth', 'dare', 'tod'],
    tags: ['fun', 'game'],
    command: /^(truth|dare|tod|truthordare)$/i,
    group: false,
    admin: false,
    botAdmin: false,
    owner: false,

    execute: async ({ jid, sock, message, args }) => {
        try {
            const command = (args.length === 0) ? 
                message.message?.conversation?.split(' ')[0]?.replace(config.PREFIX, '')?.toLowerCase() || 'tod' :
                args[0]?.toLowerCase() || 'tod'

            const cmdUsed = message.message?.conversation?.split(' ')[0]?.replace(config.PREFIX, '')?.toLowerCase() || 
                           message.message?.extendedTextMessage?.text?.split(' ')[0]?.replace(config.PREFIX, '')?.toLowerCase() || 'tod'

            if (cmdUsed === 'truth') {
                const truth = truths[Math.floor(Math.random() * truths.length)]
                await sock.sendMessage(jid, {
                    text: `╭━━━━━━━━━━━━━━━━━━━━╮
┃   🤔 TRUTH          ┃
╰━━━━━━━━━━━━━━━━━━━━╯

${truth}

_Answer honestly! No lying!_ 😏`,
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
            } else if (cmdUsed === 'dare') {
                const dare = dares[Math.floor(Math.random() * dares.length)]
                await sock.sendMessage(jid, {
                    text: `╭━━━━━━━━━━━━━━━━━━━━╮
┃   😈 DARE           ┃
╰━━━━━━━━━━━━━━━━━━━━╯

${dare}

_You must do it! No backing out!_ 💪`,
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
            } else {
                const isTruth = Math.random() > 0.5
                const item = isTruth 
                    ? truths[Math.floor(Math.random() * truths.length)]
                    : dares[Math.floor(Math.random() * dares.length)]
                    
                await sock.sendMessage(jid, {
                    text: `╭━━━━━━━━━━━━━━━━━━━━╮
┃   🎲 TRUTH OR DARE  ┃
╰━━━━━━━━━━━━━━━━━━━━╯

*${isTruth ? '🤔 TRUTH' : '😈 DARE'}:*

${item}

_Use ${config.PREFIX}truth or ${config.PREFIX}dare for specific!_`,
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
            }
        } catch (err) {
            await sock.sendMessage(jid, {
                text: `❌ Error: ${err.message}`
            }, { quoted: message })
        }
    }
}

module.exports = { handler }

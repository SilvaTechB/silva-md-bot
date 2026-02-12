const fetch = require('node-fetch');

const handler = {
    help: ['tinyurl', 'shorten'],
    tags: ['tools'],
    command: /^(tinyurl|short|acortar|corto)$/i,
    group: false,
    admin: false,
    botAdmin: false,
    owner: false,

    execute: async ({ jid, sock, message, args, text }) => {
        try {
            const sender = message.key.participant || message.key.remoteJid;

            if (!text) throw '*❌ Please provide a URL to shorten.*';

            const longUrl = args[0];
            const shortUrl = await (await fetch(`https://tinyurl.com/api-create.php?url=${longUrl}`)).text();

            if (!shortUrl) throw '*❌ Error: Could not generate a short URL.*';

            const replyMsg = `
🍀 *SILVA BOT URL SHORTENER* 🌐

*Original Link:*
${longUrl}

*Shortened URL:*
${shortUrl}
            `.trim();

            await sock.sendMessage(jid, {
                text: replyMsg,
                contextInfo: {
                    mentionedJid: [sender],
                    forwardingScore: 999,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: "120363200367779016@newsletter",
                        newsletterName: "SILVA BOT URL SHORTENER💖",
                        serverMessageId: 143
                    }
                }
            });
        } catch (error) {
            console.error(error);
            await sock.sendMessage(jid, {
                text: '❌ Something went wrong while shortening the URL.',
                contextInfo: {
                    mentionedJid: [message.key.participant || message.key.remoteJid],
                    forwardingScore: 999,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: "120363200367779016@newsletter",
                        newsletterName: "SILVA BOT URL SHORTENER💖",
                        serverMessageId: 143
                    }
                }
            });
        }
    }
};

module.exports = { handler };

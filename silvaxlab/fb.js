const axios = require("axios");
const fg = require("api-dylux");

const handler = {
    help: ["fb", "fbdl", "facebook"],
    tags: ["downloader", "media"],
    command: /^(fb|fbdl|facebook)$/i,
    group: false,
    admin: false,
    botAdmin: false,
    owner: false,

    execute: async ({ jid, sock, message, args }) => {
        const sender = message.key.participant || message.key.remoteJid;
        const fbUrl = args[0];

        if (!fbUrl || !/(facebook\.com|fb\.watch)/i.test(fbUrl)) {
            return await sock.sendMessage(
                jid,
                {
                    text:
                        "❌ *Invalid Facebook link*\n\n" +
                        "Example:\n" +
                        ".fb https://www.facebook.com/share/v/xxxxx",
                    contextInfo: ctx(sender, "Silva MD FB Hub 📘")
                },
                { quoted: message }
            );
        }

        try {
            await sock.sendMessage(
                jid,
                {
                    text: "📥 *Fetching Facebook media…*",
                    contextInfo: ctx(sender, "Silva MD FB Hub 📘")
                },
                { quoted: message }
            );

            const result = await fg.fbdl(fbUrl);

            if (!result?.videoUrl) {
                throw new Error("No downloadable media found");
            }

            // Optional: pre-check URL availability
            await axios.head(result.videoUrl, { timeout: 10000 });

            await sock.sendMessage(
                jid,
                {
                    video: { url: result.videoUrl },
                    caption:
                        "🎥 *Facebook Video*\n\n" +
                        "Powered by *Silva MD*",
                    contextInfo: ctx(sender, "Silva MD FB Hub 📘")
                },
                { quoted: message }
            );

        } catch (err) {
            await sock.sendMessage(
                jid,
                {
                    text:
                        "❌ *Facebook Download Error:*\n" +
                        (err.message || err),
                    contextInfo: ctx(sender, "Silva MD Errors ⚠️")
                },
                { quoted: message }
            );
        }
    }
};

module.exports = { handler };

function ctx(sender, name) {
    return {
        mentionedJid: [sender],
        forwardingScore: 999,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
            newsletterJid: "120363200367779016@newsletter",
            newsletterName: name,
            serverMessageId: Math.floor(Math.random() * 1000)
        }
    };
}
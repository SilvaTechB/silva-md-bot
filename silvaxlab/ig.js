const axios = require("axios");
const { igdl } = require("ruhend-scraper");

const handler = {
    help: ["ig", "igdl", "instagram"],
    tags: ["downloader", "media"],
    command: /^(ig|igdl|instagram)$/i,
    group: false,
    admin: false,
    botAdmin: false,
    owner: false,

    execute: async ({ jid, sock, message, args }) => {
        const sender = message.key.participant || message.key.remoteJid;
        const igUrl = args[0];

        if (!igUrl || !igUrl.includes("instagram.com")) {
            return await sock.sendMessage(
                jid,
                {
                    text:
                        "❌ *Invalid Instagram link*\n\n" +
                        "Example:\n" +
                        ".ig https://www.instagram.com/reel/xxxxx",
                    contextInfo: ctx(sender, "Silva MD IG Hub 📸")
                },
                { quoted: message }
            );
        }

        try {
            await sock.sendMessage(
                jid,
                {
                    text: "📥 *Fetching Instagram media…*",
                    contextInfo: ctx(sender, "Silva MD IG Hub 📸")
                },
                { quoted: message }
            );

            const result = await igdl(igUrl);

            if (!result?.data?.length) {
                throw new Error("No downloadable media found");
            }

            const media = result.data[0];

            // Optional availability check
            await axios.head(media.url, { timeout: 10000 });

            await sock.sendMessage(
                jid,
                {
                    video: { url: media.url },
                    caption:
                        "🎥 *Instagram Video*\n\n" +
                        "Powered by *Silva MD*",
                    contextInfo: ctx(sender, "Silva MD IG Hub 📸")
                },
                { quoted: message }
            );

        } catch (err) {
            await sock.sendMessage(
                jid,
                {
                    text:
                        "❌ *Instagram Download Error:*\n" +
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
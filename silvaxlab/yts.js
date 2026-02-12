// YouTube Search Plugin (Silva MD)

const yts = require("yt-search");

const handler = {
    help: ["yts", "ytsearch"],
    tags: ["search", "media"],
    command: /^(yts|ytsearch|search)$/i,
    group: false,
    admin: false,
    botAdmin: false,
    owner: false,

    execute: async ({ jid, sock, message, args }) => {
        const sender = message.key.participant || message.key.remoteJid;
        const query = args.join(" ");

        if (!query) {
            return await sock.sendMessage(jid, {
                text: "❌ *What should I search?*\n\nExample:\n.yts Adele Hello",
                contextInfo: baseContext(sender)
            }, { quoted: message });
        }

        await sock.sendMessage(jid, {
            text: "🔍 *Searching YouTube…*\nHold tight, summoning the algorithm gods.",
            contextInfo: baseContext(sender)
        }, { quoted: message });

        try {
            const result = await yts(query);
            const videos = result.videos.slice(0, 5);

            if (!videos.length) {
                return await sock.sendMessage(jid, {
                    text: "😵 *No results found.*\nYouTube shrugged.",
                    contextInfo: baseContext(sender)
                }, { quoted: message });
            }

            let text = `🎬 *YouTube Search Results*\n\n`;

            videos.forEach((v, i) => {
                text +=
                    `*${i + 1}. ${v.title}*\n` +
                    `⏱ ${v.timestamp} | 👁 ${v.views.toLocaleString()}\n` +
                    `📺 ${v.author.name}\n` +
                    `🔗 ${v.url}\n\n`;
            });

            text += `✨ Powered by *Silva MD YouTube Engine*`;

            await sock.sendMessage(jid, {
                image: { url: videos[0].thumbnail },
                caption: text,
                contextInfo: baseContext(sender)
            }, { quoted: message });

        } catch (err) {
            await sock.sendMessage(jid, {
                text: `❌ *Search Error:*\n${err.message}`,
                contextInfo: baseContext(sender, true)
            }, { quoted: message });
        }
    }
};

module.exports = { handler };

function baseContext(sender, error = false) {
    return {
        mentionedJid: [sender],
        forwardingScore: 999,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
            newsletterJid: "120363200367779016@newsletter",
            newsletterName: error
                ? "Silva MD Errors ⚠️"
                : "Silva MD YouTube Hub ▶️",
            serverMessageId: 148
        }
    };
}
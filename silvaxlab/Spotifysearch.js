// Spotify Search Plugin (Silva MD)

const axios = require("axios");

const handler = {
    help: ["spotify", "sp"],
    tags: ["search", "music"],
    command: /^(spotify|sp|sps)$/i,
    group: false,
    admin: false,
    botAdmin: false,
    owner: false,

    execute: async ({ jid, sock, message, args }) => {
        const sender = message.key.participant || message.key.remoteJid;
        const query = args.join(" ");

        if (!query) {
            return await sock.sendMessage(jid, {
                text: "❌ *Spotify search needs a keyword.*\n\nExample:\n.spotify lelena",
                contextInfo: baseContext(sender)
            }, { quoted: message });
        }

        await sock.sendMessage(jid, {
            text: "🎧 *Searching Spotify…*\nDigging through millions of tracks.",
            contextInfo: baseContext(sender)
        }, { quoted: message });

        try {
            const { data } = await axios.get(
                `https://api-lite.silvatechinc.my.id/search/spotify?q=${encodeURIComponent(query)}`
            );

            if (!data.status || !data.result.length) {
                return await sock.sendMessage(jid, {
                    text: "😶 *No tracks found.*\nSpotify came up empty.",
                    contextInfo: baseContext(sender)
                }, { quoted: message });
            }

            const tracks = data.result.slice(0, 8);

            let text = `🎵 *Spotify Search Results*\n\n`;

            tracks.forEach((t, i) => {
                text +=
                    `*${i + 1}. ${t.title}*\n` +
                    `👤 ${t.artist}\n` +
                    `⏱ ${msToTime(t.duration)} | ⭐ ${t.popularity}\n` +
                    `🔗 ${t.url}\n\n`;
            });

            text += `✨ Powered by *Silva MD Spotify Engine*`;

            await sock.sendMessage(jid, {
                text,
                contextInfo: baseContext(sender)
            }, { quoted: message });

        } catch (err) {
            await sock.sendMessage(jid, {
                text: `❌ *Spotify Error:*\n${err.message}`,
                contextInfo: baseContext(sender, true)
            }, { quoted: message });
        }
    }
};

module.exports = { handler };

function msToTime(ms) {
    const minutes = Math.floor(ms / 60000);
    const seconds = ((ms % 60000) / 1000).toFixed(0);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
}

function baseContext(sender, error = false) {
    return {
        mentionedJid: [sender],
        forwardingScore: 999,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
            newsletterJid: "120363200367779016@newsletter",
            newsletterName: error
                ? "Silva MD Errors ⚠️"
                : "Silva MD Spotify Hub 🎧",
            serverMessageId: 181
        }
    };
}
// CapCut Downloader Plugin (Silva MD)

const axios = require("axios");

const handler = {
    help: ["capcut", "capcutdl", "cc"],
    tags: ["downloader", "video"],
    command: /^(capcut|capcutdl|cc)$/i,
    group: false,
    admin: false,
    botAdmin: false,
    owner: false,

    execute: async ({ jid, sock, message, args }) => {
        const sender = message.key.participant || message.key.remoteJid;
        const capcutUrl = args[0];

        if (!capcutUrl || !capcutUrl.includes("capcut.com")) {
            return await sock.sendMessage(jid, {
                text: "❌ *Invalid CapCut link*\n\nExample:\n.capcut https://www.capcut.com/tv2/xxxx",
                contextInfo: {
                    mentionedJid: [sender],
                    forwardingScore: 999,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: "120363200367779016@newsletter",
                        newsletterName: "Silva MD CapCut Hub 🎬",
                        serverMessageId: 146
                    }
                }
            }, { quoted: message });
        }

        try {
            await sock.sendMessage(jid, {
                text: "🎬 *Fetching CapCut template…*",
                contextInfo: {
                    mentionedJid: [sender],
                    forwardingScore: 999,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: "120363200367779016@newsletter",
                        newsletterName: "Silva MD CapCut Hub 🎬",
                        serverMessageId: 146
                    }
                }
            }, { quoted: message });

            const apiUrl = `https://api.nekolabs.web.id/dwn/capcut?url=${encodeURIComponent(capcutUrl)}`;
            const { data } = await axios.get(apiUrl);

            if (!data.success || !data.result?.videoUrl) {
                throw new Error("CapCut video not found");
            }

            const { title, author, videoUrl } = data.result;

            const caption =
                `🎬 *CapCut Template*\n\n` +
                `📌 *Title:* ${title || "Unknown"}\n` +
                `👤 *Author:* ${author?.name || "Unknown"}\n\n` +
                `⚡ Powered by *Silva MD*`;

            await sock.sendMessage(jid, {
                video: { url: videoUrl },
                caption,
                contextInfo: {
                    mentionedJid: [sender],
                    forwardingScore: 999,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: "120363200367779016@newsletter",
                        newsletterName: "Silva MD CapCut Hub 🎬",
                        serverMessageId: 146
                    }
                }
            }, { quoted: message });

        } catch (err) {
            await sock.sendMessage(jid, {
                text: `❌ *CapCut Download Error:*\n${err.message}`,
                contextInfo: {
                    mentionedJid: [sender],
                    forwardingScore: 999,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: "120363200367779016@newsletter",
                        newsletterName: "Silva MD Errors ⚠️",
                        serverMessageId: 146
                    }
                }
            }, { quoted: message });
        }
    }
};

module.exports = { handler };
const axios = require("axios");

const handler = {
    help: ["element", "ele"],
    tags: ["tools", "education"],
    command: /^(element|ele|periodic)$/i,
    group: false,
    admin: false,
    botAdmin: false,
    owner: false,

    execute: async ({ jid, sock, message, args }) => {
        const sender = message.key.participant || message.key.remoteJid;
        const text = args.join(" ");

        try {
            if (!text) {
                return await sock.sendMessage(
                    jid,
                    {
                        text: "🧪 *Silva Chemistry Lab*\n\nGive me an element name or symbol.\n\nExamples:\n• `.element H`\n• `.element oxygen`\n\nNo guessing. This is science.",
                        contextInfo: {
                            mentionedJid: [sender],
                            forwardingScore: 999,
                            isForwarded: true,
                            forwardedNewsletterMessageInfo: {
                                newsletterJid: "120363200367779016@newsletter",
                                newsletterName: "SILVA SCIENCE LAB 🧬",
                                serverMessageId: 143
                            }
                        }
                    },
                    { quoted: message }
                );
            }

            const res = await axios.get(
                `https://api.popcat.xyz/periodic-table?element=${encodeURIComponent(text)}`
            );

            const data = res.data;

            if (!data || !data.name) {
                return await sock.sendMessage(
                    jid,
                    {
                        text: `😂 *Chemistry Alert!*\n\n"${text}" is NOT an element.\nDid you attend class or just vibes?`,
                        contextInfo: {
                            mentionedJid: [sender],
                            forwardingScore: 999,
                            isForwarded: true
                        }
                    },
                    { quoted: message }
                );
            }

            const input = text.toLowerCase();
            if (
                input !== data.name.toLowerCase() &&
                input !== data.symbol.toLowerCase()
            ) {
                return await sock.sendMessage(
                    jid,
                    {
                        text: `🤓 You probably meant *${data.name}* (${data.symbol}).\n\nI’ll allow it… this time.`,
                        contextInfo: {
                            mentionedJid: [sender],
                            forwardingScore: 999,
                            isForwarded: true
                        }
                    },
                    { quoted: message }
                );
            }

            const info = `
🧪 *SILVA MD – ELEMENT REPORT*

• *Name:* ${data.name}
• *Symbol:* ${data.symbol}
• *Atomic Number:* ${data.atomic_number}
• *Atomic Mass:* ${data.atomic_mass}
• *Period:* ${data.period}
• *Phase:* ${data.phase}
• *Discovered By:* ${data.discovered_by || "Ancient humans causing chaos"}
• *Summary:* ${data.summary}

⚛️ Result verified.
🌍 Universe still stable.
            `.trim();

            await sock.sendMessage(
                jid,
                {
                    image: { url: data.image },
                    caption: info,
                    contextInfo: {
                        mentionedJid: [sender],
                        forwardingScore: 999,
                        isForwarded: true,
                        externalAdReply: {
                            title: "SILVA MD CHEMISTRY 🧬",
                            body: "Where bots know more science than your teacher",
                            sourceUrl: "https://silvatech.top",
                            showAdAttribution: true,
                            thumbnailUrl: "https://i.imgur.com/8hQvY5j.png"
                        },
                        forwardedNewsletterMessageInfo: {
                            newsletterJid: "120363200367779016@newsletter",
                            newsletterName: "SILVA SCIENCE LAB 🧪",
                            serverMessageId: 143
                        }
                    }
                },
                { quoted: message }
            );

        } catch (err) {
            console.error("Element plugin error:", err);
            await sock.sendMessage(
                jid,
                {
                    text: "💥 *Lab Explosion!*\n\nThe chemistry API fainted.\nTry again later.",
                    contextInfo: {
                        mentionedJid: [sender],
                        forwardingScore: 999,
                        isForwarded: true
                    }
                },
                { quoted: message }
            );
        }
    }
};

module.exports = { handler };

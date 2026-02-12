const handler = {
    help: ["settings", "checkvars"],
    tags: ["system", "info"],
    command: /^(settings|checkvars)$/i,
    group: false,
    admin: false,
    botAdmin: false,
    owner: true, // ⚠️ env vars are sensitive — owner only

    execute: async ({ jid, sock, message }) => {
        const sender = message.key.participant || message.key.remoteJid;

        try {
            const envVars = process.env;
            const keys = Object.keys(envVars);

            if (!keys.length) {
                return await sock.sendMessage(
                    jid,
                    {
                        text: "❌ *Environment Status*\n\nNo environment variables found.\nEither this bot lives dangerously… or something is wrong.",
                        contextInfo: {
                            mentionedJid: [sender]
                        }
                    },
                    { quoted: message }
                );
            }

            let report = `🔧 *SILVA MD – ENVIRONMENT CHECK*\n\n`;

            for (const key of keys) {
                report += `• ${key}: ${envVars[key] ? "✅ SET" : "❌ NOT SET"}\n`;
            }

            report += `\n🧠 Verdict:\nBot brain is powered.\nSecrets are (mostly) intact.`;

            await sock.sendMessage(
                jid,
                {
                    text: report,
                    contextInfo: {
                        mentionedJid: [sender],
                        forwardingScore: 999,
                        isForwarded: true,
                        forwardedNewsletterMessageInfo: {
                            newsletterJid: "120363200367779016@newsletter",
                            newsletterName: "SILVA MD SYSTEM CORE ⚙️",
                            serverMessageId: 143
                        },
                        externalAdReply: {
                            title: "SILVA MD SYSTEM MONITOR",
                            body: "Environment variables under surveillance 👁️",
                            sourceUrl: "https://silvatech.top",
                            showAdAttribution: true,
                            thumbnailUrl: "https://i.imgur.com/8hQvY5j.png"
                        }
                    }
                },
                { quoted: message }
            );

        } catch (err) {
            await sock.sendMessage(
                jid,
                {
                    text: `💥 *System Glitch*\n\nFailed to read environment variables.\n${err.message}`,
                    contextInfo: {
                        mentionedJid: [sender]
                    }
                },
                { quoted: message }
            );
        }
    }
};

module.exports = { handler };

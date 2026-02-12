// plugins/gitclone.js

const getFetch = async () => {
    const module = await import('node-fetch');
    return module.default;
};

const handler = {
    help: ['gitclone'],
    tags: ['tools', 'downloader'],
    command: /^(gitclone)$/i,
    group: false,
    admin: false,
    botAdmin: false,
    owner: false,

    execute: async ({ jid, sock, message, args }) => {
        const sender = message.key.participant || message.key.remoteJid;
        const usedPrefix = '.';

        // ✅ Correct GitHub repo regex
        const regex = /github\.com\/([^\/]+)\/([^\/\s]+)(?:\.git)?/i;

        try {
            if (!args[0]) {
                return sock.sendMessage(
                    jid,
                    {
                        text:
                            "❌ *Where is the GitHub link?*\n\n" +
                            `📌 Example:\n${usedPrefix}gitclone https://github.com/SilvaTechB/silva-md-bot`,
                        contextInfo: ctx(sender, "Silva MD GitHub Hub 🐙")
                    },
                    { quoted: message }
                );
            }

            if (!regex.test(args[0])) {
                return sock.sendMessage(
                    jid,
                    {
                        text: "⚠️ *Invalid GitHub repository link*",
                        contextInfo: ctx(sender, "Silva MD Errors ⚠️")
                    },
                    { quoted: message }
                );
            }

            const [, user, repo] = args[0].match(regex);
            const cleanRepo = repo.replace(/\.git$/, '');
            const zipUrl = `https://api.github.com/repos/${user}/${cleanRepo}/zipball`;

            await sock.sendMessage(
                jid,
                {
                    text: "📦 *Preparing repository… please wait*",
                    contextInfo: ctx(sender, "Silva MD GitHub Hub 🐙")
                },
                { quoted: message }
            );

            // Dynamic fetch
            const fetch = await getFetch();
            const head = await fetch(zipUrl, { method: 'HEAD' });

            const disposition = head.headers.get('content-disposition');
            const filename =
                disposition?.match(/filename=(.*)/)?.[1] ||
                `${cleanRepo}.zip`;

            await sock.sendMessage(
                jid,
                {
                    document: { url: zipUrl },
                    fileName: filename,
                    mimetype: 'application/zip',
                    caption:
                        "✅ *GitHub Repository Downloaded*\n\n" +
                        `📦 *${user}/${cleanRepo}*\n\n` +
                        "Powered by *Silva MD*",
                    contextInfo: {
                        ...ctx(sender, "Silva MD GitHub Hub 🐙"),
                        externalAdReply: {
                            title: "GitHub Clone",
                            body: "Download repositories instantly",
                            thumbnailUrl: "https://files.catbox.moe/5uli5p.jpeg",
                            sourceUrl: `https://github.com/${user}/${cleanRepo}`,
                            mediaType: 1,
                            renderLargerThumbnail: true
                        }
                    }
                },
                { quoted: message }
            );

        } catch (error) {
            console.error("GitClone Error:", error);
            await sock.sendMessage(
                jid,
                {
                    text:
                        "❌ *Failed to download repository*\n\n" +
                        error.message,
                    contextInfo: ctx(sender, "Silva MD Errors ⚠️")
                },
                { quoted: message }
            );
        }
    }
};

module.exports = { handler };


// 🧠 Shared contextInfo builder
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
// All-In-One Downloader (Silva MD)

const axios = require("axios");

const AIO_APIS = [
    "https://api.nekolabs.web.id/dwn/aio/v1?url=",
    "https://api.nekolabs.web.id/dwn/aio/v2?url=",
    "https://api.nekolabs.web.id/dwn/aio/v3?url=",
    "https://api.nekolabs.web.id/dwn/aio/v4?url="
];

const handler = {
    help: ["aio", "download", "dl"],
    tags: ["downloader", "media"],
    command: /^(aio|download|dl)$/i,
    group: false,
    admin: false,
    botAdmin: false,
    owner: false,

    execute: async ({ jid, sock, message, args }) => {
        const sender = message.key.participant || message.key.remoteJid;
        const url = args[0];

        if (!url || !url.startsWith("http")) {
            return await sock.sendMessage(jid, {
                text: "❌ *Invalid URL*\n\nExample:\n.aio https://youtube.com/...",
                contextInfo: baseContext(sender, "Silva MD Downloader 🌐")
            }, { quoted: message });
        }

        await sock.sendMessage(jid, {
            text: "🌐 *Silva MD AIO Downloader*\nTrying multiple engines…",
            contextInfo: baseContext(sender, "Silva MD Downloader 🌐")
        }, { quoted: message });

        let data, apiUsed;

        for (const api of AIO_APIS) {
            try {
                const res = await axios.get(api + encodeURIComponent(url), { timeout: 20000 });
                if (res.data?.success && res.data?.result) {
                    data = res.data.result;
                    apiUsed = api;
                    break;
                }
            } catch {}
        }

        if (!data) {
            return await sock.sendMessage(jid, {
                text: "❌ *All download engines failed.*\nTry again later.",
                contextInfo: baseContext(sender, "Silva MD Errors ⚠️")
            }, { quoted: message });
        }

        const title = data.title || data.metadata?.title || "Downloaded Media";
        const mediaUrl =
            data.videoUrl ||
            data.downloadUrl ||
            (Array.isArray(data.url) ? data.url[0] : null);

        if (!mediaUrl) {
            return await sock.sendMessage(jid, {
                text: "❌ *Media URL not found.*",
                contextInfo: baseContext(sender, "Silva MD Errors ⚠️")
            }, { quoted: message });
        }

        const caption =
            `📥 *All-In-One Download*\n\n` +
            `📌 *Title:* ${title}\n` +
            `⚙️ *Engine:* ${apiUsed.split("/").slice(-2).join("/")}\n\n` +
            `💠 Powered by *Silva MD*`;

        // Media type detection
        if (mediaUrl.endsWith(".mp3") || mediaUrl.includes("audio")) {
            await sock.sendMessage(jid, {
                audio: { url: mediaUrl },
                mimetype: "audio/mpeg",
                ptt: false,
                contextInfo: baseContext(sender, "Silva MD Downloader 🌐")
            }, { quoted: message });

        } else if (mediaUrl.endsWith(".mp4") || mediaUrl.includes("video")) {
            await sock.sendMessage(jid, {
                video: { url: mediaUrl },
                caption,
                contextInfo: baseContext(sender, "Silva MD Downloader 🌐")
            }, { quoted: message });

        } else {
            await sock.sendMessage(jid, {
                document: { url: mediaUrl },
                fileName: `${title}.bin`,
                caption,
                contextInfo: baseContext(sender, "Silva MD Downloader 🌐")
            }, { quoted: message });
        }
    }
};

module.exports = { handler };

function baseContext(sender, name) {
    return {
        mentionedJid: [sender],
        forwardingScore: 999,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
            newsletterJid: "120363200367779016@newsletter",
            newsletterName: name,
            serverMessageId: 147
        }
    };
}
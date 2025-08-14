const fetch = require('node-fetch');

module.exports = {
    name: "tiktok-dl",
    alias: ["ttdl", "tiktok"],
    desc: "Download TikTok videos",
    category: "Media",
    async exec({ m, sock, args }) {
        if (!args[0]) return m.reply("Please provide a TikTok URL\nExample: !ttdl https://vt.tiktok.com/ZSje1Vkup/");
        
        const url = args[0].match(/(https?:\/\/[^\s]+)/)?.[0];
        if (!url || !/tiktok\.com|vt\.tiktok\.com/.test(url)) {
            return m.reply("Invalid TikTok URL. Please provide a valid link.");
        }

        try {
            // Show loading indicator
            await sock.sendMessage(m.chat, { text: "⏳ Downloading TikTok video..." }, { quoted: m });
            
            const apiUrl = `https://silva-api.vercel.app/download/tiktokdl?url=${encodeURIComponent(url)}`;
            const response = await fetch(apiUrl);
            const data = await response.json();
            
            if (data.status === "success") {
                const video = data.result;
                const downloadUrl = video.nowm || video.wm || video.hd || video.sd;
                
                if (downloadUrl) {
                    await sock.sendMessage(m.chat, {
                        video: { url: downloadUrl },
                        caption: `🚀 TikTok Downloader\n\n🔗 *Source:* ${url}\n📦 *API:* Silva-API`
                    }, { quoted: m });
                } else {
                    throw new Error("No valid video URL found in response");
                }
            } else {
                throw new Error(data.message || "Failed to download video");
            }
        } catch (error) {
            console.error(error);
            await sock.sendMessage(m.chat, {
                text: `❌ Download failed!\nError: ${error.message}\n\nPlease try again later or use a different URL.`
            }, { quoted: m });
        }
    }
};

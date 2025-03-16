import { stickerTelegram } from "@bochilteam/scraper";
import axios from "axios";

let handler = async (m, { conn, args }) => {
    if (!args[0]) return m.reply("❌ *Provide a valid Telegram Sticker URL or search query!*");

    if (args[0].match(/(https:\/\/t.me\/addstickers\/)/gi)) {
        try {
            let stickers = await getTelegramStickers(args[0]);

            if (!stickers.length) return m.reply("⚠️ *No stickers found in this pack!*");

            let stickerCount = stickers.length;
            await m.reply(`✅ *Sending ${stickerCount} stickers...*`);

            // If the sticker pack is too large, send in private chat
            if (m.isGroup && stickerCount > 30) {
                await m.reply("⚠️ *Sticker pack has more than 30 stickers, sending in private chat...*");
                for (let sticker of stickers) {
                    await conn.sendMessage(m.sender, { sticker: { url: sticker.url } });
                }
            } else {
                for (let sticker of stickers) {
                    await conn.sendMessage(m.chat, { sticker: { url: sticker.url } });
                }
            }

        } catch (error) {
            console.error("❌ Error fetching Telegram stickers:", error);
            return m.reply("⚠️ *Failed to fetch stickers. Please try again later!*");
        }

    } else {
        try {
            let [query, page] = args.join(" ").split("|");
            let results = await stickerTelegram(query, page);
            if (!results.length) return m.reply(`⚠️ *No stickers found for query:* "${args.join(" ")}"`);

            let stickerLinks = results.map(v => `*${v.title}*\n_${v.link}_`).join("\n\n");
            return m.reply(stickerLinks);

        } catch (error) {
            console.error("❌ Search error:", error);
            return m.reply("⚠️ *Failed to find stickers. Check your search query and try again!*");
        }
    }
};

handler.help = ["telesticker"];
handler.tags = ["tools"];
handler.command = /^(telestic?ker|tgsticker)$/i;
handler.limit = true;

export default handler;

// 🔹 Function to fetch Telegram Stickers via Telegram API
async function getTelegramStickers(url) {
    if (!url.match(/(https:\/\/t.me\/addstickers\/)/gi)) throw "❌ *Enter a valid Telegram Sticker URL!*";

    try {
        let packName = url.replace("https://t.me/addstickers/", "");
        let { data } = await axios.get(
            `https://api.telegram.org/bot891038791:AAHWB1dQd-vi0IbH2NjKYUk-hqQ8rQuzPD4/getStickerSet?name=${encodeURIComponent(packName)}`
        );

        if (!data.result || !data.result.stickers) throw "⚠️ *Sticker pack not found!*";

        let stickers = [];
        for (let sticker of data.result.stickers) {
            let fileId = sticker.thumb.file_id;
            let { data: fileData } = await axios.get(
                `https://api.telegram.org/bot891038791:AAHWB1dQd-vi0IbH2NjKYUk-hqQ8rQuzPD4/getFile?file_id=${fileId}`
            );

            stickers.push({
                url: `https://api.telegram.org/file/bot891038791:AAHWB1dQd-vi0IbH2NjKYUk-hqQ8rQuzPD4/${fileData.result.file_path}`
            });
        }

        return stickers;

    } catch (error) {
        console.error("❌ Telegram Sticker Fetch Error:", error);
        throw "⚠️ *Failed to retrieve sticker pack. Please check the link!*";
    }
}

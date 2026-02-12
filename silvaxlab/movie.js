// Movie Downloader Plugin - Silva MD Bot
const axios = require("axios")
const config = require("../config")

const movieCache = new Map() // stores search results per chat

const handler = {
    help: ["movie"],
    tags: ["movie", "download"],
    command: /^movie$/i,
    group: false,
    admin: false,
    botAdmin: false,
    owner: false,

    execute: async ({ sock, jid, message, args }) => {
        const sender = message.key.participant || message.key.remoteJid
        const query = args.join(" ").trim()

        try {
            // ===============================
            // STEP 1: SEARCH MOVIE
            // ===============================
            if (!query) {
                // Check if this is a reply with a number
                const replyText = message.message?.extendedTextMessage?.text ||
                                 message.message?.conversation ||
                                 message.message?.extendedTextMessage?.contextInfo?.quotedMessage?.conversation

                if (replyText && /^\d+$/.test(replyText.trim())) {
                    // This is a number selection
                    await handleMovieSelection(sock, jid, message, sender, parseInt(replyText.trim()))
                    return
                }

                // Show usage
                return sock.sendMessage(jid, {
                    text: `┏━━━━━━━━━━━━━━━━━━━━┓
┃   ᴍᴏᴠɪᴇ sᴇᴀʀᴄʜ     ┃
┗━━━━━━━━━━━━━━━━━━━━┛

ᴜsᴀɢᴇ:
${config.PREFIX}movie <name>

ᴇxᴀᴍᴘʟᴇ:
${config.PREFIX}movie Black Panther
${config.PREFIX}movie Avengers

💡 Reply with number to download`,
                    contextInfo: createContext(sender, "SILVA MD • MOVIES")
                }, { quoted: message })
            }

            // Search for movies
            await sock.sendMessage(jid, {
                react: { text: "🔍", key: message.key }
            })

            const searchUrl = `https://movieapi.giftedtech.co.ke/api/search/${encodeURIComponent(query)}`
            console.log("Searching:", searchUrl)

            const res = await axios.get(searchUrl, {
                headers: {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                    "Accept": "application/json"
                },
                timeout: 15000
            })

            if (!res.data?.results?.items || res.data.results.items.length === 0) {
                await sock.sendMessage(jid, {
                    react: { text: "❌", key: message.key }
                })
                return sock.sendMessage(jid, {
                    text: `❌ No movies found for: *${query}*\n\nTry:\n• Different spelling\n• Full movie name\n• Remove special characters`,
                    contextInfo: createContext(sender, "SILVA MD • MOVIES")
                }, { quoted: message })
            }

            const items = res.data.results.items.slice(0, 10)
            movieCache.set(jid, items)

            // Auto-expire cache after 5 minutes
            setTimeout(() => movieCache.delete(jid), 5 * 60 * 1000)

            let text = `┏━━━━━━━━━━━━━━━━━━━━┓
┃   ᴍᴏᴠɪᴇ ʀᴇsᴜʟᴛs    ┃
┗━━━━━━━━━━━━━━━━━━━━┛

🎬 Found ${items.length} results for: *${query}*

`

            items.forEach((m, i) => {
                const year = m.releaseDate?.split("-")[0] || "N/A"
                const rating = m.imdbRatingValue || "N/A"
                text += `*${i + 1}.* ${m.title}\n`
                text += `   📅 ${year} • ⭐ ${rating}\n\n`
            })

            text += `┏─『 ɪɴsᴛʀᴜᴄᴛɪᴏɴs 』──⊷
│ Reply with number (1-${items.length})
│ Movie sent as document
┗──────────────⊷

⚡ ᴘᴏᴡᴇʀᴇᴅ ʙʏ sɪʟᴠᴀ ᴍᴅ`

            await sock.sendMessage(jid, {
                react: { text: "✅", key: message.key }
            })

            await sock.sendMessage(jid, {
                text,
                contextInfo: createContext(sender, "SILVA MD • MOVIES")
            }, { quoted: message })

        } catch (err) {
            console.error("Movie search error:", err)
            await sock.sendMessage(jid, {
                text: `❌ Search failed: ${err.message}`,
                contextInfo: createContext(sender, "SILVA MD • ERROR")
            }, { quoted: message })
        }
    }
}

// ===============================
// HANDLE MOVIE SELECTION
// ===============================
async function handleMovieSelection(sock, jid, message, sender, choice) {
    try {
        const cached = movieCache.get(jid)

        if (!cached) {
            return sock.sendMessage(jid, {
                text: `❌ Session expired. Please search again using:\n${config.PREFIX}movie <name>`,
                contextInfo: createContext(sender, "SILVA MD • MOVIES")
            }, { quoted: message })
        }

        if (isNaN(choice) || choice < 1 || choice > cached.length) {
            return sock.sendMessage(jid, {
                text: `❌ Invalid choice. Please reply with a number between 1-${cached.length}`,
                contextInfo: createContext(sender, "SILVA MD • MOVIES")
            }, { quoted: message })
        }

        const selected = cached[choice - 1]

        // Show fetching message
        await sock.sendMessage(jid, {
            text: `┏━━━━━━━━━━━━━━━━━━━━┓
┃   ғᴇᴛᴄʜɪɴɢ ᴍᴏᴠɪᴇ   ┃
┗━━━━━━━━━━━━━━━━━━━━┛

🎬 ${selected.title}
📅 ${selected.releaseDate?.split("-")[0] || "N/A"}
⭐ ${selected.imdbRatingValue || "N/A"}

⏳ Getting download links...`,
            contextInfo: createContext(sender, "SILVA MD • MOVIES")
        }, { quoted: message })

        // Fetch download sources
        const sourceUrl = `https://movieapi.giftedtech.co.ke/api/sources/${selected.subjectId}`
        console.log("Fetching sources:", sourceUrl)

        const srcResponse = await axios.get(sourceUrl, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                "Accept": "application/json"
            },
            timeout: 15000
        })

        if (!srcResponse.data?.results || srcResponse.data.results.length === 0) {
            throw new Error("No download sources available")
        }

        // Select best quality (prefer 480p, then 360p, then any)
        const qualities = srcResponse.data.results
        let best = qualities.find(v => v.quality === "480p") ||
                   qualities.find(v => v.quality === "360p") ||
                   qualities.find(v => v.quality === "720p") ||
                   qualities[0]

        if (!best?.download_url) {
            throw new Error("No valid download URL found")
        }

        console.log(`Selected quality: ${best.quality}`)
        console.log(`Download URL: ${best.download_url}`)

        // Update status
        await sock.sendMessage(jid, {
            text: `📥 Downloading... (${best.quality})
⏳ This may take a while...`,
            contextInfo: createContext(sender, "SILVA MD • MOVIES")
        }, { quoted: message })

        // Download the movie
        const videoResponse = await axios.get(best.download_url, {
            responseType: "arraybuffer",
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                "Referer": "https://movieapi.giftedtech.co.ke",
                "Accept": "*/*"
            },
            maxBodyLength: Infinity,
            maxContentLength: Infinity,
            timeout: 300000, // 5 minutes timeout
            onDownloadProgress: (progressEvent) => {
                const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total)
                if (percent % 25 === 0) {
                    console.log(`Download progress: ${percent}%`)
                }
            }
        })

        console.log(`Downloaded ${videoResponse.data.byteLength} bytes`)

        // Send as document
        const fileName = `${selected.title.replace(/[^\w\s-]/g, "")} (${best.quality}).mp4`

        await sock.sendMessage(jid, {
            document: Buffer.from(videoResponse.data),
            mimetype: "video/mp4",
            fileName: fileName,
            caption: `🎬 ${selected.title}
📅 ${selected.releaseDate?.split("-")[0] || "N/A"}
⭐ ${selected.imdbRatingValue || "N/A"}
📦 Quality: ${best.quality}

⚡ ᴘᴏᴡᴇʀᴇᴅ ʙʏ sɪʟᴠᴀ ᴍᴅ`,
            contextInfo: createContext(sender, "SILVA MD • MOVIES")
        }, { quoted: message })

        // Clear cache for this chat
        movieCache.delete(jid)

        console.log(`Movie sent successfully: ${fileName}`)

    } catch (err) {
        console.error("Movie download error:", err)
        await sock.sendMessage(jid, {
            text: `┏━━━━━━━━━━━━━━━━━━━━┓
┃   ᴅᴏᴡɴʟᴏᴀᴅ ғᴀɪʟᴇᴅ  ┃
┗━━━━━━━━━━━━━━━━━━━━┛

❌ ${err.message}

┏─『 ᴘᴏssɪʙʟᴇ ʀᴇᴀsᴏɴs 』──⊷
│ • Movie not available
│ • Download link expired
│ • File too large
│ • Network timeout
┗──────────────⊷

💡 Try another movie`,
            contextInfo: createContext(sender, "SILVA MD • ERROR")
        }, { quoted: message })
    }
}

// Helper function for context info
function createContext(sender, name) {
    return {
        mentionedJid: [sender],
        forwardingScore: 999,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
            newsletterJid: "120363200367779016@newsletter",
            newsletterName: name,
            serverMessageId: Math.floor(Math.random() * 1000)
        }
    }
}

module.exports = { handler }

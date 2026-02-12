const fs = require('fs')

// Native fetch (Node 18+)
// DO NOT import node-fetch

const handler = {
  command: "lyrics",
  alias: ["lyric", "lirik"],
  react: "🎵",
  desc: "Get song lyrics",
  category: "music",

  execute: async ({ sock, message, args, botLogger }) => {
    try {
      const text = args.join(" ").trim()
      const jid = message.key.remoteJid

      if (!text) {
        return sock.sendMessage(
          jid,
          {
            text:
`🎶 *Lyrics Finder*

Usage:
.lyrics <song name>

Example:
.lyrics perfect ed sheeran`
          },
          { quoted: message }
        )
      }

      // ===== API FALLBACK STACK =====
      const apis = [
        `https://api.zenzxz.my.id/api/tools/lirik?title=${encodeURIComponent(text)}`,
        `https://some-random-api.ml/lyrics?title=${encodeURIComponent(text)}`
      ]

      let songData = null

      for (const api of apis) {
        try {
          const res = await fetch(api)
          const json = await res.json()

          if (json?.data?.result?.length) {
            songData = json.data.result[0]
            break
          }

          if (json?.lyrics) {
            songData = {
              trackName: json.title,
              artistName: json.author,
              plainLyrics: json.lyrics
            }
            break
          }
        } catch {
          continue
        }
      }

      if (!songData) {
        return sock.sendMessage(
          jid,
          { text: "❌ Lyrics not found. Try another song." },
          { quoted: message }
        )
      }

      const title = songData.trackName || text
      const artist = songData.artistName || "Unknown Artist"
      const lyrics = songData.plainLyrics || "No lyrics available"
      const thumb = "https://files.catbox.moe/5uli5p.jpeg"

      const shortLyrics =
        lyrics.length > 900
          ? lyrics.slice(0, 900) + "\n\n(reply *1* for full lyrics file)"
          : lyrics

      const caption =
`🎼 *SILVA LYRICS*

🎵 *Title:* ${title}
🎤 *Artist:* ${artist}

${shortLyrics}`

      const sent = await sock.sendMessage(
        jid,
        {
          image: { url: thumb },
          caption
        },
        { quoted: message }
      )

      // ===== FULL LYRICS HANDLER =====
      const listener = async (update) => {
        const m = update.messages?.[0]
        if (!m?.message) return

        const body =
          m.message.conversation ||
          m.message.extendedTextMessage?.text ||
          ""

        if (
          body.trim() === "1" &&
          m.message.extendedTextMessage?.contextInfo?.stanzaId === sent.key.id
        ) {
          const file = `${title.replace(/[^a-zA-Z0-9]/g, "_")}.txt`
          fs.writeFileSync(file, `${title}\nby ${artist}\n\n${lyrics}`)

          await sock.sendMessage(
            jid,
            {
              document: fs.readFileSync(file),
              mimetype: "text/plain",
              fileName: file,
              caption: `🎶 Full lyrics: *${title}*`
            },
            { quoted: m }
          )

          fs.unlinkSync(file)
          sock.ev.off("messages.upsert", listener)
        }
      }

      sock.ev.on("messages.upsert", listener)
      setTimeout(() => sock.ev.off("messages.upsert", listener), 180000)

    } catch (err) {
      await sock.sendMessage(
        message.key.remoteJid,
        {
          text:
`❌ *Lyrics Error*
${err.message}`
        },
        { quoted: message }
      )
    }
  }
}

module.exports = { handler }

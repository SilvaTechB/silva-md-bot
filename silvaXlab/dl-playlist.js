// playlist.js

import yts from 'yt-search'
import ytdl from 'ytdl-core'
import fs from 'fs'
import { promisify } from 'util'
import { pipeline } from 'stream'
import os from 'os'

const streamPipeline = promisify(pipeline)

let handler = async (m, { conn, command, text, usedPrefix }) => {
    if (!text) throw `*Enter a playlist URL or name!*\n\n*Example:*\n${usedPrefix + command} https://www.youtube.com/playlist?list=PL...`
    try {
        let playlist
        if (text.includes('youtube.com/playlist')) {
            playlist = await ytdl.getPlaylist(text)
        } else {
            let search = await yts(text)
            let vid = search.videos[0]
            if (!vid) throw 'Playlist not found!'
            playlist = await ytdl.getPlaylist(vid.url)
        }

        let songs = playlist.items
        let total = songs.length
        let downloaded = 0

        // Send "Downloading playlist..." message
        let m1 = await m.reply(`*Downloading playlist of ${total} songs...* 🎵`)

        for (let song of songs) {
            let { title, url } = song
            let filePath = `${os.tmpdir()}/${title}.mp3`

            // Download and save audio
            let stream = ytdl(url, {
                filter: 'audioonly',
                quality: 'highestaudio',
            })
            await streamPipeline(stream, fs.createWriteStream(filePath))

            // Prepare message template
            let doc = {
                audio: {
                    url: filePath
                },
                mimetype: 'audio/mpeg',
                fileName: `${title}.mp3`,
                contextInfo: {
                    externalAdReply: {
                        showAdAttribution: true,
                        mediaType: 2,
                        mediaUrl: url,
                        title: title,
                        body: 'SILVA MD MUSIC BOT',
                        sourceUrl: url,
                        thumbnail: await (await fetch(`https://i.ytimg.com/vi/${url.split('v=')[1]}/hqdefault.jpg`)).buffer()
                    }
                }
            }

            // Send audio file with metadata
            await conn.sendMessage(m.chat, doc, { quoted: m })

            // Delete temporary file
            fs.unlink(filePath, (err) => {
                if (err) console.error('Error deleting temp file:', err)
            })

            downloaded++
            await m1.reply(`*Downloaded ${downloaded} of ${total} songs...*`)
        }

        // Delete "Downloading playlist..." message
        await m1.delete()

    } catch (error) {
        console.error('Error in playlist download:', error)
        m.reply(`An error occurred: ${error.message}\nPlease try again later`)
    }
}

handler.help = ['playlist'].map(v => v + ' <url/name>')
handler.tags = ['downloader']
handler.command = /^(playlist|pl)$/i

handler.exp = 0
handler.limit = false
handler.register = false

export default handler

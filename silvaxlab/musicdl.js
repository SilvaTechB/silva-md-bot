// musicdl.js

import fetch from 'node-fetch'
import ytdl from 'ytdl-core'
import yts from 'yt-search'
import fs from 'fs'
import { pipeline } from 'stream'
import { promisify } from 'util'
import os from 'os'

const streamPipeline = promisify(pipeline)

let handler = async (m, { conn, command, text, usedPrefix }) => {
    if (!text) throw `*Enter a song name!*\n\n*Example:*\n${usedPrefix + command} Heat waves`
    try {
        let search = await yts(text)
        let vid = search.videos[0]
        if (!vid) throw 'Song/Video not found!'
        let { title, thumbnail, timestamp, views, ago, url } = vid
        
        // Send "Downloading..." message
        let m1 = await m.reply('*Downloading your song...* 🎵')
        
        // Get audio stream
        let stream = ytdl(url, {
            filter: 'audioonly',
            quality: 'highestaudio',
        })

        // Create temporary file path
        let tmpDir = os.tmpdir()
        let filePath = `${tmpDir}/${title}.mp3`

        // Download and save audio
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
                    thumbnail: await (await fetch(thumbnail)).buffer()
                }
            }
        }

        // Send audio file with metadata
        await conn.sendMessage(m.chat, doc, { quoted: m })

        // Delete temporary file
        fs.unlink(filePath, (err) => {
            if (err) console.error('Error deleting temp file:', err)
        })

        // Delete "Downloading..." message
        await m1.delete()

    } catch (error) {
        console.error('Error in music download:', error)
        m.reply(`An error occurred: ${error.message}\nPlease try again later`)
    }
}

handler.help = ['play'].map(v => v + ' <query>')
handler.tags = ['downloader']
handler.command = /^(play3|song3|music)$/i

handler.exp = 0
handler.limit = false
handler.register = false

export default handler

// Additional utility functions
async function fetchBuffer(url) {
    try {
        const response = await fetch(url)
        const buffer = await response.buffer()
        return buffer
    } catch (error) {
        console.error('Error fetching buffer:', error)
        throw error
    }
}

async function shortUrl(url) {
    try {
        const response = await fetch(`https://tinyurl.com/api-create.php?url=${url}`)
        return await response.text()
    } catch (error) {
        console.error('Error shortening URL:', error)
        return url
    }
}

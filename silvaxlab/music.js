const yts = require('yt-search')
const axios = require('axios')
const config = require('../config')

const API_BASE = 'http://127.0.0.1:3001'

const handler = {
    help: ['play <song name>', 'song <song name>'],
    tags: ['music', 'media'],
    command: /^(play|song|music)$/i,
    group: false,
    admin: false,
    botAdmin: false,
    owner: false,

    execute: async ({ jid, sock, message, args }) => {
        try {
            const sender = message.key.participant || message.key.remoteJid
            const query = args.join(' ')

            if (!query) {
                return await sock.sendMessage(jid, {
                    text: `╭━━━━━━━━━━━━━━━━━━━━╮\n┃   🎵 MUSIC PLAYER   ┃\n╰━━━━━━━━━━━━━━━━━━━━╯\n\n*Usage:*\n${config.PREFIX}play <song name>\n${config.PREFIX}song <song name>\n\n*Example:*\n${config.PREFIX}play Adele Hello\n\n_Searches YouTube and sends the audio._`
                }, { quoted: message })
            }

            await sock.sendMessage(jid, { react: { text: '🔍', key: message.key } })

            const searchResult = await yts(query)
            const videos = searchResult.videos

            if (!videos || videos.length === 0) {
                return await sock.sendMessage(jid, {
                    text: '❌ No results found for: ' + query
                }, { quoted: message })
            }

            const video = videos[0]

            if (video.seconds > 600) {
                return await sock.sendMessage(jid, {
                    text: '❌ Song too long! Max 10 minutes.'
                }, { quoted: message })
            }

            await sock.sendMessage(jid, {
                image: { url: video.thumbnail },
                caption: `🎶 *${video.title}*\n\n⏱ Duration: ${video.timestamp}\n👁 Views: ${video.views?.toLocaleString() || 'N/A'}\n📺 Channel: ${video.author?.name || 'Unknown'}\n\n_⬇️ Downloading audio..._`,
                contextInfo: {
                    forwardingScore: 999,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: '120363200367779016@newsletter',
                        newsletterName: 'SILVA MD MUSIC 🎶',
                        serverMessageId: 145
                    }
                }
            }, { quoted: message })

            await sock.sendMessage(jid, { react: { text: '⬇️', key: message.key } })

            let audioBuffer = null

            try {
                const response = await axios.get(`${API_BASE}/api/ytAudio`, {
                    params: { url: video.url },
                    responseType: 'arraybuffer',
                    timeout: 120000
                })
                if (response.data && response.data.length > 1000) {
                    audioBuffer = Buffer.from(response.data)
                }
            } catch (e) {
                console.log('[MUSIC] Local API failed:', e.message)
            }

            if (!audioBuffer) {
                const externalApis = [
                    `https://api.ryzendesu.vip/api/downloader/ytmp3?url=${encodeURIComponent(video.url)}`,
                    `https://api.dreaded.site/api/ytdl/audio?url=${encodeURIComponent(video.url)}`,
                    `https://api.giftedtech.web.id/api/download/dlmp3?url=${encodeURIComponent(video.url)}`
                ]

                for (const api of externalApis) {
                    try {
                        const { data } = await axios.get(api, { timeout: 30000 })
                        const audioUrl = data.result?.downloadUrl || data.result?.download_url || data.result?.url || data.url
                        if (audioUrl) {
                            const resp = await axios.get(audioUrl, { responseType: 'arraybuffer', timeout: 30000 })
                            if (resp.data && resp.data.length > 1000) {
                                audioBuffer = Buffer.from(resp.data)
                                break
                            }
                        }
                    } catch (e) { continue }
                }
            }

            if (!audioBuffer) {
                return await sock.sendMessage(jid, {
                    text: `⚠️ Audio download failed. Try:\n🔗 ${video.url}`
                }, { quoted: message })
            }

            await sock.sendMessage(jid, {
                audio: audioBuffer,
                mimetype: 'audio/mpeg',
                contextInfo: {
                    externalAdReply: {
                        title: video.title,
                        body: video.author?.name || 'Silva MD Music',
                        thumbnailUrl: video.thumbnail,
                        mediaType: 2,
                        mediaUrl: video.url,
                        sourceUrl: video.url
                    }
                }
            }, { quoted: message })

            await sock.sendMessage(jid, { react: { text: '🎵', key: message.key } })

        } catch (err) {
            console.error('PLAY ERROR:', err)
            await sock.sendMessage(jid, {
                text: '❌ *Music Error*\nFailed to play the song. Try again later.'
            }, { quoted: message })
        }
    }
}

module.exports = { handler }

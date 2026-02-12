const yts = require('yt-search')
const axios = require('axios')
const config = require('../config')

const API_BASE = 'http://127.0.0.1:3001'

const handler = {
    help: ['video <query>', 'ytmp4 <query>'],
    tags: ['media', 'download'],
    command: /^(video|ytmp4|playvid)$/i,
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
                    text: `╭━━━━━━━━━━━━━━━━━━━━╮\n┃   🎬 VIDEO PLAYER   ┃\n╰━━━━━━━━━━━━━━━━━━━━╯\n\n*Usage:*\n${config.PREFIX}video <name>\n${config.PREFIX}ytmp4 <url>\n\n*Example:*\n${config.PREFIX}video funny cats`
                }, { quoted: message })
            }

            await sock.sendMessage(jid, { react: { text: '🔍', key: message.key } })

            let videoUrl = query
            let videoInfo = null

            if (!query.startsWith('http')) {
                const searchResult = await yts(query)
                const videos = searchResult.videos
                if (!videos || videos.length === 0) {
                    return await sock.sendMessage(jid, { text: '❌ No results found.' }, { quoted: message })
                }
                const vid = videos[0]
                if (vid.seconds > 300) {
                    return await sock.sendMessage(jid, { text: '❌ Video too long! Max 5 minutes.' }, { quoted: message })
                }
                videoUrl = vid.url
                videoInfo = vid
            }

            if (videoInfo) {
                await sock.sendMessage(jid, {
                    image: { url: videoInfo.thumbnail },
                    caption: `🎬 *${videoInfo.title}*\n⏱ ${videoInfo.timestamp}\n📺 ${videoInfo.author?.name || 'Unknown'}\n\n_⬇️ Downloading video..._`
                }, { quoted: message })
            }

            await sock.sendMessage(jid, { react: { text: '⬇️', key: message.key } })

            let videoBuffer = null

            try {
                const response = await axios.get(`${API_BASE}/api/ytVideo`, {
                    params: { url: videoUrl },
                    responseType: 'arraybuffer',
                    timeout: 120000
                })
                if (response.data && response.data.length > 1000) {
                    videoBuffer = Buffer.from(response.data)
                }
            } catch (e) {
                console.log('[VIDEO] Local API failed:', e.message)
            }

            if (!videoBuffer) {
                const apis = [
                    `https://api.ryzendesu.vip/api/downloader/ytmp4?url=${encodeURIComponent(videoUrl)}`,
                    `https://api.dreaded.site/api/ytdl/video?url=${encodeURIComponent(videoUrl)}`
                ]
                for (const api of apis) {
                    try {
                        const { data } = await axios.get(api, { timeout: 30000 })
                        const dlUrl = data.result?.downloadUrl || data.result?.download_url || data.result?.url || data.url
                        if (dlUrl) {
                            const resp = await axios.get(dlUrl, { responseType: 'arraybuffer', timeout: 60000 })
                            if (resp.data && resp.data.length > 1000) {
                                videoBuffer = Buffer.from(resp.data)
                                break
                            }
                        }
                    } catch (e) { continue }
                }
            }

            if (!videoBuffer) {
                return await sock.sendMessage(jid, {
                    text: `⚠️ Video download failed.\n🔗 ${videoUrl}`
                }, { quoted: message })
            }

            await sock.sendMessage(jid, {
                video: videoBuffer,
                mimetype: 'video/mp4',
                caption: videoInfo ? `🎬 ${videoInfo.title}` : '🎬 Downloaded Video'
            }, { quoted: message })

            await sock.sendMessage(jid, { react: { text: '✅', key: message.key } })

        } catch (err) {
            console.error('VIDEO ERROR:', err)
            await sock.sendMessage(jid, { text: '❌ Video download failed.' }, { quoted: message })
        }
    }
}

module.exports = { handler }

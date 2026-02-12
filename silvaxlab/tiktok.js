const axios = require('axios')
const fs = require('fs')
const os = require('os')
const path = require('path')
const { pipeline } = require('stream')
const { promisify } = require('util')

const streamPipeline = promisify(pipeline)

const handler = {
    help: ['tiktok', 'tt', 'ttdl'],
    tags: ['downloader'],
    command: /^(tiktok|tt|ttdl)$/i,
    group: false,
    admin: false,
    botAdmin: false,
    owner: false,

    execute: async ({ jid, sock, message, args }) => {
        const url = args[0]

        if (!url || !/tiktok\.com|vt\.tiktok\.com/.test(url)) {
            return sock.sendMessage(jid, {
                text: '❌ *Invalid TikTok link*\n\nExample:\n.tiktok https://vt.tiktok.com/ZSxxxx/',
                contextInfo: {
                    forwardingScore: 999,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: '120363200367779016@newsletter',
                        newsletterName: 'SILVA TECH',
                        serverMessageId: 101
                    }
                }
            }, { quoted: message })
        }

        await sock.sendMessage(jid, {
            text: '⚡ *Processing TikTok media…*'
        }, { quoted: message })

        const apis = [
            {
                name: 'TikWM',
                getUrl: async () => {
                    const { data } = await axios.get(
                        `https://tikwm.com/api/?url=${encodeURIComponent(url)}`
                    )
                    return data?.data?.play
                }
            },
            {
                name: 'TiklyDown',
                getUrl: async () => {
                    const { data } = await axios.get(
                        `https://api.tiklydown.eu.org/api/download?url=${encodeURIComponent(url)}`
                    )
                    return data?.videoUrl
                }
            },
            {
                name: 'SnapTik',
                getUrl: async () => {
                    const { data } = await axios.get(
                        `https://snaptik.app/abc2.php?url=${encodeURIComponent(url)}`
                    )
                    return data?.video_url
                }
            }
        ]

        let videoUrl = null
        let usedApi = null

        for (const api of apis) {
            try {
                videoUrl = await api.getUrl()
                if (videoUrl) {
                    usedApi = api.name
                    break
                }
            } catch {
                continue
            }
        }

        if (!videoUrl) {
            return sock.sendMessage(jid, {
                text: '❌ *All download servers failed.*\n\nThe video may be private, removed, or region-locked.'
            }, { quoted: message })
        }

        const tempFile = path.join(os.tmpdir(), `tiktok-${Date.now()}.mp4`)

        const stream = await axios({
            method: 'GET',
            url: videoUrl,
            responseType: 'stream',
            timeout: 30000
        })

        await streamPipeline(stream.data, fs.createWriteStream(tempFile))

        await sock.sendMessage(jid, {
            video: fs.readFileSync(tempFile),
            caption:
                `🎵 *TikTok Video*\n` +
                `⚙️ Source: ${usedApi}\n` +
                `🔗 Original: ${url}`,
            contextInfo: {
                mentionedJid: [message.key.participant || jid],
                forwardingScore: 888,
                isForwarded: true
            }
        }, { quoted: message })

        fs.unlinkSync(tempFile)
    }
}

module.exports = { handler }

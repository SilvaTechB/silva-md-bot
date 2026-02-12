const crypto = require('crypto')
const ffmpeg = require('fluent-ffmpeg')
const { PassThrough } = require('stream')
const baileys = require('@whiskeysockets/baileys')

const handler = {
    help: [
        'togstatus [caption|color|group_url]',
        'Reply to image / video / audio'
    ],
    tags: ['group', 'tools'],
    command: /^(togstatus|swgc|groupstatus)$/i,
    group: true,
    admin: false,   // any user can use
    botAdmin: false,
    owner: false,

    execute: async ({ jid, sock, message, text }) => {
        const reply = (txt) =>
            sock.sendMessage(jid, { text: txt, contextInfo: { mentionedJid: [message.key.participant || message.key.remoteJid], forwardingScore: 999, isForwarded: true, forwardedNewsletterMessageInfo: { newsletterJid: "120363200367779016@newsletter", newsletterName: "SILVA GROUP STATUS💖", serverMessageId: 143 } } }, { quoted: message })

        try {
            const from = message.key.remoteJid
            const quoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage

            // Remove the command part from text
            let [caption, color, groupUrl] = (text || '')
                .replace(/^\.?\w+\s*/, '')
                .split('|')
                .map(v => v?.trim())

            let targetGroupId = from

            // Handle external group link
            if (groupUrl) {
                try {
                    const code = groupUrl.split('/').pop().split('?')[0]
                    const info = await sock.groupGetInviteInfo(code)
                    targetGroupId = info.id
                    await reply(`🎯 Target group: *${info.subject}*`)
                } catch {
                    return reply('❌ Invalid group link or bot not in that group')
                }
            }

            // TEXT STATUS
            if (!quoted) {
                if (!caption) {
                    return reply(
                        `📝 *Group Status Usage*\n\n.togstatus caption|color\n.togstatus |blue\nReply to image / video / audio\n\n🎨 Colors:\nblue, green, yellow, orange, red,\npurple, gray, black, white, cyan`
                    )
                }

                const colors = {
                    blue: '#34B7F1',
                    green: '#25D366',
                    yellow: '#FFD700',
                    orange: '#FF8C00',
                    red: '#FF3B30',
                    purple: '#9C27B0',
                    gray: '#9E9E9E',
                    black: '#000000',
                    white: '#FFFFFF',
                    cyan: '#00BCD4'
                }

                await groupStatus(sock, targetGroupId, {
                    text: caption,
                    backgroundColor: colors[color?.toLowerCase()] || colors.blue
                })

                return reply('✅ Text status sent')
            }

            // IMAGE STATUS
            if (quoted.imageMessage) {
                const buf = await baileys.downloadMediaMessage(
                    { message: quoted, key: message.key },
                    'buffer',
                    {},
                    { reuploadRequest: sock.updateMediaMessage }
                )

                await groupStatus(sock, targetGroupId, {
                    image: buf,
                    caption: caption || ''
                })

                return reply('✅ Image status sent')
            }

            // VIDEO STATUS
            if (quoted.videoMessage) {
                const buf = await baileys.downloadMediaMessage(
                    { message: quoted, key: message.key },
                    'buffer',
                    {},
                    { reuploadRequest: sock.updateMediaMessage }
                )

                await groupStatus(sock, targetGroupId, {
                    video: buf,
                    caption: caption || ''
                })

                return reply('✅ Video status sent')
            }

            // AUDIO STATUS
            if (quoted.audioMessage) {
                const buf = await baileys.downloadMediaMessage(
                    { message: quoted, key: message.key },
                    'buffer',
                    {},
                    { reuploadRequest: sock.updateMediaMessage }
                )

                const vn = await toVN(buf)
                const waveform = await generateWaveform(buf)

                await groupStatus(sock, targetGroupId, {
                    audio: vn,
                    mimetype: 'audio/ogg; codecs=opus',
                    ptt: true,
                    waveform
                })

                return reply('✅ Audio status sent')
            }

            return reply('❌ Unsupported media type')

        } catch (err) {
            return reply(`❌ Status error:\n${err.message}`)
        }
    }
}

module.exports = { handler }

// ================= HELPERS =================

async function groupStatus(conn, jid, content) {
    const { backgroundColor } = content
    delete content.backgroundColor

    const inside = await baileys.generateWAMessageContent(content, {
        upload: conn.waUploadToServer,
        backgroundColor
    })

    const secret = crypto.randomBytes(32)

    const msg = baileys.generateWAMessageFromContent(
        jid,
        {
            messageContextInfo: { messageSecret: secret },
            groupStatusMessageV2: {
                message: {
                    ...inside,
                    messageContextInfo: { messageSecret: secret }
                }
            }
        },
        {}
    )

    await conn.relayMessage(jid, msg.message, { messageId: msg.key.id })
    return msg
}

function toVN(buffer) {
    return new Promise((resolve, reject) => {
        const input = new PassThrough()
        const output = new PassThrough()
        const chunks = []

        input.end(buffer)

        ffmpeg(input)
            .noVideo()
            .audioCodec('libopus')
            .format('ogg')
            .audioChannels(1)
            .audioFrequency(48000)
            .on('error', reject)
            .on('end', () => resolve(Buffer.concat(chunks)))
            .pipe(output)

        output.on('data', c => chunks.push(c))
    })
}

function generateWaveform(buffer, bars = 64) {
    return new Promise((resolve, reject) => {
        const input = new PassThrough()
        input.end(buffer)

        const chunks = []

        ffmpeg(input)
            .audioChannels(1)
            .audioFrequency(16000)
            .format('s16le')
            .on('error', reject)
            .on('end', () => {
                const raw = Buffer.concat(chunks)
                const samples = raw.length / 2
                const amps = []

                for (let i = 0; i < samples; i++) {
                    amps.push(Math.abs(raw.readInt16LE(i * 2)) / 32768)
                }

                const size = Math.floor(amps.length / bars)
                const avg = Array.from({ length: bars }, (_, i) =>
                    amps.slice(i * size, (i + 1) * size).reduce((a, b) => a + b, 0) / size
                )

                const max = Math.max(...avg)
                resolve(
                    Buffer.from(avg.map(v => Math.floor((v / max) * 100))).toString('base64')
                )
            })
            .pipe()
            .on('data', c => chunks.push(c))
    })
}

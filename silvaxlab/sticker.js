const { downloadMediaMessage } = require('@whiskeysockets/baileys')
const sharp = require('sharp')
const fs = require('fs')
const path = require('path')
const config = require('../config')

const handler = {
    help: ['sticker', 'stiker', 's'],
    tags: ['media'],
    command: /^(sticker|stiker|s)$/i,
    group: false,
    admin: false,
    botAdmin: false,
    owner: false,

    execute: async ({ jid, sock, message }) => {
        try {
            let targetMsg = message
            const quoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage
            if (quoted) {
                targetMsg = {
                    key: {
                        remoteJid: jid,
                        id: message.message.extendedTextMessage.contextInfo.stanzaId,
                        participant: message.message.extendedTextMessage.contextInfo.participant
                    },
                    message: quoted
                }
            }

            let msgContent = targetMsg.message
            if (msgContent?.ephemeralMessage?.message) msgContent = msgContent.ephemeralMessage.message
            if (msgContent?.viewOnceMessage?.message) msgContent = msgContent.viewOnceMessage.message
            if (msgContent?.viewOnceMessageV2?.message) msgContent = msgContent.viewOnceMessageV2.message
            if (msgContent?.documentWithCaptionMessage?.message) msgContent = msgContent.documentWithCaptionMessage.message

            const isImage = !!msgContent?.imageMessage
            const isVideo = !!msgContent?.videoMessage
            const isSticker = !!msgContent?.stickerMessage

            if (!isImage && !isVideo && !isSticker) {
                return await sock.sendMessage(jid, {
                    text: `╭━━━━━━━━━━━━━━━━━━━━╮
┃   🎨 STICKER MAKER  ┃
╰━━━━━━━━━━━━━━━━━━━━╯

*How to use:*
1. Send an image with caption *${config.PREFIX}sticker*
2. Reply to an image with *${config.PREFIX}sticker*
3. Send a short video with caption *${config.PREFIX}sticker*

_Supports: Images, Short Videos_`,
                    contextInfo: {
                        forwardingScore: 999,
                        isForwarded: true,
                        forwardedNewsletterMessageInfo: {
                            newsletterJid: '120363200367779016@newsletter',
                            newsletterName: 'SILVA MD STICKER',
                            serverMessageId: Math.floor(Math.random() * 1000)
                        }
                    }
                }, { quoted: message })
            }

            if (isVideo) {
                const duration = msgContent.videoMessage?.seconds || 0
                if (duration > 15) {
                    return await sock.sendMessage(jid, {
                        text: '❌ Video too long! Max 15 seconds for stickers.'
                    }, { quoted: message })
                }
            }

            await sock.sendMessage(jid, { react: { text: '🎨', key: message.key } })

            const buffer = await downloadMediaMessage(targetMsg, 'buffer', {}, {
                logger: { error: () => {}, warn: () => {}, info: () => {}, debug: () => {} },
                reuploadRequest: sock.updateMediaMessage
            })

            if (!buffer || buffer.length === 0) {
                return await sock.sendMessage(jid, {
                    text: '❌ Failed to download media. Try again.'
                }, { quoted: message })
            }

            let stickerBuffer
            if (isImage || isSticker) {
                stickerBuffer = await sharp(buffer)
                    .resize(512, 512, {
                        fit: 'contain',
                        background: { r: 0, g: 0, b: 0, alpha: 0 }
                    })
                    .webp({ quality: 80 })
                    .toBuffer()
            } else if (isVideo) {
                const ffmpeg = require('fluent-ffmpeg')
                const tempInput = path.join(__dirname, '..', 'temp', `stk_in_${Date.now()}.mp4`)
                const tempOutput = path.join(__dirname, '..', 'temp', `stk_out_${Date.now()}.webp`)

                const tempDir = path.join(__dirname, '..', 'temp')
                if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true })

                fs.writeFileSync(tempInput, buffer)

                await new Promise((resolve, reject) => {
                    ffmpeg(tempInput)
                        .outputOptions([
                            '-vcodec', 'libwebp',
                            '-vf', 'scale=512:512:force_original_aspect_ratio=decrease,fps=15,pad=512:512:-1:-1:color=black@0.0,split[a][b];[a]palettegen=reserve_transparent=on:transparency_color=ffffff[p];[b][p]paletteuse',
                            '-loop', '0',
                            '-ss', '00:00:00',
                            '-t', '00:00:10',
                            '-preset', 'default',
                            '-an',
                            '-vsync', '0'
                        ])
                        .toFormat('webp')
                        .save(tempOutput)
                        .on('end', resolve)
                        .on('error', reject)
                })

                stickerBuffer = fs.readFileSync(tempOutput)
                try { fs.unlinkSync(tempInput) } catch(e) {}
                try { fs.unlinkSync(tempOutput) } catch(e) {}
            }

            if (stickerBuffer) {
                await sock.sendMessage(jid, {
                    sticker: stickerBuffer,
                    contextInfo: {
                        externalAdReply: {
                            title: config.BOT_NAME || 'Silva MD',
                            body: 'Sticker by Silva MD',
                            mediaType: 1,
                            renderLargerThumbnail: false
                        }
                    }
                }, { quoted: message })

                await sock.sendMessage(jid, { react: { text: '✅', key: message.key } })
            }

        } catch (error) {
            console.error('Sticker error:', error)
            await sock.sendMessage(jid, {
                text: `❌ Sticker creation failed: ${error.message}`
            }, { quoted: message })
        }
    }
}

module.exports = { handler }

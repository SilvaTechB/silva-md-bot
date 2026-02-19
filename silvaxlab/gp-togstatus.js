import crypto from 'crypto'
import { generateWAMessageContent, generateWAMessageFromContent, downloadContentFromMessage } from '@whiskeysockets/baileys'
import { PassThrough } from 'stream'
import ffmpeg from 'fluent-ffmpeg'

let handler = async (m, { conn, text }) => {
  try {
    let [caption, color, groupUrl] = (text || '').split('|').map(v => v?.trim())

    let targetGroupId = m.chat

    if (groupUrl) {
      try {
        const code = groupUrl.split('/').pop().split('?')[0]
        const info = await conn.groupGetInviteInfo(code)
        targetGroupId = info.id
        await m.reply(`🎯 Target group: *${info.subject}*`)
      } catch {
        return m.reply('❌ Invalid group link or bot is not in that group')
      }
    }

    const q = m.quoted

    if (!q) {
      if (!caption) {
        return m.reply(
          `📝 *Group Status Usage*\n\n*.togstatus* caption|color\n*.togstatus* |blue\nReply to image/video/audio with *.togstatus*\n\n🎨 *Colors:*\nblue, green, yellow, orange, red,\npurple, gray, black, white, cyan`
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

      await m.reply('⏳ Posting text status...')

      try {
        await groupStatus(conn, targetGroupId, {
          text: caption,
          backgroundColor: colors[color?.toLowerCase()] || colors.blue
        })
        return m.reply('✅ Text status posted to group!')
      } catch (e) {
        return m.reply('❌ Failed to post text status: ' + e.message)
      }
    }

    const mtype = q.mtype || (q.message ? Object.keys(q.message)[0] : '')

    let downloadBuf = async () => {
      if (q.download) return await q.download()
      const qmsg = q.message || q
      if (/image/i.test(mtype)) return await downloadMedia(qmsg, 'image')
      if (/video/i.test(mtype)) return await downloadMedia(qmsg, 'video')
      if (/audio/i.test(mtype)) return await downloadMedia(qmsg, 'audio')
      return null
    }

    if (/image/i.test(mtype)) {
      await m.reply('⏳ Posting image status...')
      let buf
      try { buf = await downloadBuf() } catch { return m.reply('❌ Failed to download image') }
      if (!buf) return m.reply('❌ Could not download image')

      try {
        await groupStatus(conn, targetGroupId, { image: buf, caption: caption || '' })
        return m.reply('✅ Image status posted to group!')
      } catch (e) {
        return m.reply('❌ Failed to post image status: ' + e.message)
      }
    }

    if (/video/i.test(mtype)) {
      await m.reply('⏳ Posting video status...')
      let buf
      try { buf = await downloadBuf() } catch { return m.reply('❌ Failed to download video') }
      if (!buf) return m.reply('❌ Could not download video')

      try {
        await groupStatus(conn, targetGroupId, { video: buf, caption: caption || '' })
        return m.reply('✅ Video status posted to group!')
      } catch (e) {
        return m.reply('❌ Failed to post video status: ' + e.message)
      }
    }

    if (/audio/i.test(mtype)) {
      await m.reply('⏳ Posting audio status...')
      let buf
      try { buf = await downloadBuf() } catch { return m.reply('❌ Failed to download audio') }
      if (!buf) return m.reply('❌ Could not download audio')

      let vn
      try { vn = await toVN(buf) } catch { vn = buf }

      let waveform
      try { waveform = await generateWaveform(buf) } catch { waveform = undefined }

      try {
        await groupStatus(conn, targetGroupId, {
          audio: vn,
          mimetype: 'audio/ogg; codecs=opus',
          ptt: true,
          waveform
        })
        return m.reply('✅ Audio status posted to group!')
      } catch (e) {
        return m.reply('❌ Failed to post audio status: ' + e.message)
      }
    }

    return m.reply('❌ Unsupported media type. Reply to an image, video, or audio.')
  } catch (e) {
    return m.reply('❌ Error: ' + (e.message || e))
  }
}

handler.help = ['togstatus caption|color|group_url']
handler.tags = ['group']
handler.command = /^(togstatus|swgc|groupstatus)$/i
handler.group = true

export default handler

async function downloadMedia(msg, type) {
  const mediaMsg = msg[`${type}Message`] || msg
  const stream = await downloadContentFromMessage(mediaMsg, type)
  const chunks = []
  for await (const chunk of stream) {
    chunks.push(chunk)
  }
  return Buffer.concat(chunks)
}

async function groupStatus(conn, jid, content) {
  const { backgroundColor } = content
  delete content.backgroundColor

  const inside = await generateWAMessageContent(content, {
    upload: conn.waUploadToServer,
    backgroundColor
  })

  const secret = crypto.randomBytes(32)

  const msg = generateWAMessageFromContent(
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
        if (size === 0) return resolve(undefined)

        const avg = Array.from({ length: bars }, (_, i) =>
          amps.slice(i * size, (i + 1) * size).reduce((a, b) => a + b, 0) / size
        )

        const max = Math.max(...avg)
        if (max === 0) return resolve(undefined)

        resolve(
          Buffer.from(avg.map(v => Math.floor((v / max) * 100))).toString('base64')
        )
      })
      .pipe()
      .on('data', c => chunks.push(c))
  })
}

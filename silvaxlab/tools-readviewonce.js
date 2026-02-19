import { downloadContentFromMessage } from '@whiskeysockets/baileys'

let handler = async (m, { conn }) => {
  if (!m.quoted) throw '❌ Reply to a view once message'

  const quotedMsg = m.quoted.message || m.quoted
  const mtype = m.quoted.mtype || Object.keys(quotedMsg)[0]

  const isViewOnce = /viewOnce/i.test(mtype) ||
    quotedMsg?.viewOnceMessageV2 ||
    quotedMsg?.viewOnceMessageV2Extension

  if (!isViewOnce) throw '❌ That is not a view once message. Reply to a view once message.'

  let innerMsg = quotedMsg
  if (quotedMsg?.viewOnceMessageV2?.message) {
    innerMsg = quotedMsg.viewOnceMessageV2.message
  } else if (quotedMsg?.viewOnceMessageV2Extension?.message) {
    innerMsg = quotedMsg.viewOnceMessageV2Extension.message
  }

  const mediaType = Object.keys(innerMsg).find(k =>
    ['imageMessage', 'videoMessage', 'audioMessage'].includes(k)
  )

  if (!mediaType) throw '❌ No media found in the view once message'

  const mediaMsg = innerMsg[mediaType]
  const downloadType = mediaType.replace('Message', '').toLowerCase()

  let buffer
  try {
    if (m.quoted.download) {
      buffer = await m.quoted.download()
    } else {
      const stream = await downloadContentFromMessage(mediaMsg, downloadType)
      const chunks = []
      for await (const chunk of stream) {
        chunks.push(chunk)
      }
      buffer = Buffer.concat(chunks)
    }
  } catch {
    throw '❌ Failed to download the view once media. It may have expired.'
  }

  if (!buffer || buffer.length === 0) throw '❌ Could not retrieve the media content'

  const caption = mediaMsg.caption || ''
  const type = mediaType.replace('Message', '')

  if (type === 'audio') {
    await conn.sendMessage(m.chat, {
      audio: buffer,
      mimetype: 'audio/mpeg',
      ptt: true
    }, { quoted: m })
  } else {
    await conn.sendMessage(m.chat, {
      [type]: buffer,
      caption
    }, { quoted: m })
  }
}

handler.help = ['readvo', 'vv']
handler.tags = ['tools']
handler.command = ['readviewonce', 'read', 'vv', 'readvo']

export default handler

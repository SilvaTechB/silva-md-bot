import { download } from 'aptoide-scraper'

let handler = async (m, { oreo, usedPrefix: prefix, command, text }) => {
  try {
    if (!text) throw `📦 *Please provide the name of the APK you want to download.*\n\nExample:\n${prefix + command} Spotify Premium`

    await oreo.reply(m.chat, global.wait, m)

    let data = await download(text)
    let sizeMB = parseFloat(data.size.replace(' MB', '').replace(',', '.'))

    if (data.size.includes('GB') || sizeMB > 200) {
      return await oreo.sendMessage(
        m.chat,
        {
          text: `⛔ *File too large to send.*\n\n🗃️ *Size:* ${data.size}`,
          contextInfo: {
            forwardingScore: 999,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
              newsletterJid: '120363026198979636@newsletter',
              serverMessageId: '',
              newsletterName: 'Silva MD Bot Official'
            }
          }
        },
        { quoted: m }
      )
    }

    await oreo.sendMessage(
      m.chat,
      {
        document: { url: data.dllink },
        mimetype: 'application/vnd.android.package-archive',
        fileName: `${data.name}.apk`,
        caption: `✅ *APK:* ${data.name}\n📦 *Size:* ${data.size}\n\nEnjoy your modded app!`,
        contextInfo: {
          forwardingScore: 999,
          isForwarded: true,
          forwardedNewsletterMessageInfo: {
            newsletterJid: '120363026198979636@newsletter',
            serverMessageId: '',
            newsletterName: 'Silva MD Bot Official'
          }
        }
      },
      { quoted: m }
    )
  } catch (err) {
    console.error(err)
    throw `❗ *An error occurred.*\nPlease check your search term or try a different APK name.`
  }
}

handler.help = ['modapk <name>']
handler.tags = ['downloader']
handler.command = /^modapk$/i
export default handler

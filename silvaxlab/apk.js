const axios = require('axios')
const config = require('../config')

const handler = {
    help: ['apk <app name>'],
    tags: ['utility', 'download'],
    command: /^(apk|app)$/i,
    group: false,
    admin: false,
    botAdmin: false,
    owner: false,

    execute: async ({ jid, sock, message, args }) => {
        try {
            const query = args.join(' ')

            if (!query) {
                return await sock.sendMessage(jid, {
                    text: `╭━━━━━━━━━━━━━━━━━━━━╮\n┃   📦 APK DOWNLOAD   ┃\n╰━━━━━━━━━━━━━━━━━━━━╯\n\n*Usage:*\n${config.PREFIX}apk <app name>\n\n*Example:*\n${config.PREFIX}apk WhatsApp`
                }, { quoted: message })
            }

            await sock.sendMessage(jid, { react: { text: '🔍', key: message.key } })

            const searchApis = [
                `https://api.ryzendesu.vip/api/search/playstore?query=${encodeURIComponent(query)}`,
                `https://api.giftedtech.web.id/api/search/playstore?query=${encodeURIComponent(query)}`
            ]

            let appData = null
            for (const api of searchApis) {
                try {
                    const { data } = await axios.get(api, { timeout: 15000 })
                    if (data.result || data.data || data.results) {
                        const results = data.result || data.data || data.results
                        appData = Array.isArray(results) ? results[0] : results
                        break
                    }
                } catch (e) { continue }
            }

            if (!appData) {
                return await sock.sendMessage(jid, {
                    text: `❌ App "${query}" not found on Play Store.`
                }, { quoted: message })
            }

            const name = appData.name || appData.title || query
            const dev = appData.developer || appData.dev || 'Unknown'
            const icon = appData.icon || appData.image || appData.thumbnail || ''
            const link = appData.link || appData.url || ''
            const dlLink = appData.dllink || appData.download || appData.downloadUrl || ''

            let infoMsg = `╭━━━━━━━━━━━━━━━━━━━━╮\n┃   📦 APK FOUND      ┃\n╰━━━━━━━━━━━━━━━━━━━━╯\n\n📱 *Name:* ${name}\n👨‍💻 *Developer:* ${dev}`
            if (appData.rating) infoMsg += `\n⭐ *Rating:* ${appData.rating}`
            if (appData.size) infoMsg += `\n📏 *Size:* ${appData.size}`
            if (link) infoMsg += `\n🔗 *Link:* ${link}`

            if (icon) {
                await sock.sendMessage(jid, {
                    image: { url: icon },
                    caption: infoMsg
                }, { quoted: message })
            } else {
                await sock.sendMessage(jid, { text: infoMsg }, { quoted: message })
            }

            if (dlLink) {
                await sock.sendMessage(jid, { react: { text: '⬇️', key: message.key } })
                try {
                    const response = await axios.get(dlLink, { responseType: 'arraybuffer', timeout: 60000 })
                    await sock.sendMessage(jid, {
                        document: Buffer.from(response.data),
                        mimetype: 'application/vnd.android.package-archive',
                        fileName: `${name.replace(/[^a-zA-Z0-9]/g, '_')}.apk`
                    }, { quoted: message })
                    await sock.sendMessage(jid, { react: { text: '✅', key: message.key } })
                } catch (e) {
                    await sock.sendMessage(jid, {
                        text: `⚠️ Could not download APK directly.\n🔗 Download here: ${link || dlLink}`
                    }, { quoted: message })
                }
            } else if (link) {
                await sock.sendMessage(jid, {
                    text: `📥 *Download from:* ${link}`
                }, { quoted: message })
            }

        } catch (err) {
            await sock.sendMessage(jid, { text: '❌ Error: ' + err.message }, { quoted: message })
        }
    }
}

module.exports = { handler }

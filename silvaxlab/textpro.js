const config = require('../config')
const axios = require('axios')
const cheerio = require('cheerio')

const TEXTPRO_EFFECTS = {
    'neon': { url: 'https://textpro.me/neon-light-text-effect-online-882.html', texts: 1 },
    'matrix': { url: 'https://textpro.me/matrix-style-text-effect-online-884.html', texts: 1 },
    'thunder': { url: 'https://textpro.me/online-thunder-text-effect-generator-free-890.html', texts: 1 },
    'toxic': { url: 'https://textpro.me/toxic-text-effect-online-901.html', texts: 1 },
    'lava': { url: 'https://textpro.me/lava-text-effect-online-914.html', texts: 1 },
    'berry': { url: 'https://textpro.me/berry-text-effect-online-free-917.html', texts: 1 },
    'fiction': { url: 'https://textpro.me/science-fiction-text-effect-online-free-920.html', texts: 1 },
    'marble': { url: 'https://textpro.me/3d-marble-text-effect-online-free-921.html', texts: 1 },
    'pencil': { url: 'https://textpro.me/create-a-pencil-sketch-text-effect-online-1044.html', texts: 1 },
    'neondevil': { url: 'https://textpro.me/create-a-neon-devil-wings-text-effect-online-free-1014.html', texts: 1 },
    'dropwater': { url: 'https://textpro.me/dropwater-text-effect-871.html', texts: 1 },
    'candy': { url: 'https://textpro.me/candy-text-effect-online-free-918.html', texts: 1 },
    'metal': { url: 'https://textpro.me/create-a-metallic-text-effect-free-online-1041.html', texts: 1 },
    'blood': { url: 'https://textpro.me/blood-text-effect-online-880.html', texts: 1 },
    'wolf': { url: 'https://textpro.me/create-wolf-metal-text-effect-online-free-1084.html', texts: 1 },
    'harrypotter': { url: 'https://textpro.me/create-harry-potter-text-effect-online-free-1085.html', texts: 1 },
    'pornhub': { url: 'https://textpro.me/pornhub-style-logo-online-generator-free-977.html', texts: 2 },
    'cloud': { url: 'https://textpro.me/create-a-cloud-text-effect-online-free-1004.html', texts: 1 },
    'glitch': { url: 'https://textpro.me/create-glitch-text-effect-style-tiktok-online-free-1052.html', texts: 1 },
    'ocean': { url: 'https://textpro.me/create-3d-ocean-text-effect-online-1053.html', texts: 1 },
    'blackpink': { url: 'https://textpro.me/create-blackpink-logo-style-online-1001.html', texts: 1 },
    'carbon': { url: 'https://textpro.me/3d-carbon-text-effect-online-1055.html', texts: 1 },
    'embossed': { url: 'https://textpro.me/create-3d-embossed-text-effect-online-1110.html', texts: 1 },
    'paper': { url: 'https://textpro.me/create-paper-cut-text-effect-online-free-1024.html', texts: 1 },
    'graffiti': { url: 'https://textpro.me/create-wonderful-graffiti-text-effect-online-1089.html', texts: 1 }
}

async function createTextpro(effectUrl, texts) {
    try {
        const session = axios.create({
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
            },
            timeout: 20000
        })

        const { data: page, headers: pageHeaders } = await session.get(effectUrl)
        const $ = cheerio.load(page)

        const token = $('input[name="token"]').val()
        const cookies = pageHeaders['set-cookie']?.map(c => c.split(';')[0]).join('; ') || ''

        const formData = new URLSearchParams()
        formData.append('token', token || '')
        texts.forEach((t, i) => formData.append(`text[${i}]`, t))

        const { data: result } = await session.post(effectUrl, formData.toString(), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Referer': effectUrl,
                'Cookie': cookies
            }
        })

        if (typeof result === 'object' && result.image) {
            let imageUrl = result.image
            if (!imageUrl.startsWith('http')) {
                imageUrl = 'https://textpro.me' + imageUrl
            }
            return imageUrl
        }

        const $r = cheerio.load(typeof result === 'string' ? result : '')
        let imageUrl = $r('.thumbnail img').attr('src') || $r('#image_preview img').attr('src')

        if (!imageUrl && typeof result === 'string') {
            const match = result.match(/https?:\/\/[^\s"'<>]+\.(jpg|jpeg|png|webp)/i)
            if (match) imageUrl = match[0]
        }

        if (imageUrl && !imageUrl.startsWith('http')) {
            imageUrl = 'https://textpro.me' + imageUrl
        }

        return imageUrl
    } catch (e) {
        console.log('[TEXTPRO] Direct scrape failed:', e.message)
        return null
    }
}

async function createTextproApi(effectName, texts) {
    const apis = [
        {
            url: `https://api.nexoracle.com/textpro/${effectName}?apikey=free&text=${encodeURIComponent(texts[0])}`,
            extract: (d) => d.result?.image || d.result?.url || d.result
        },
        {
            url: `https://api.ryzendesu.vip/api/maker/textpro/${effectName}?text=${encodeURIComponent(texts[0])}`,
            extract: (d) => d.result?.image || d.result?.url || d.url
        }
    ]

    for (const api of apis) {
        try {
            const { data } = await axios.get(api.url, { timeout: 20000 })
            const imgUrl = api.extract(data)
            if (imgUrl && typeof imgUrl === 'string' && imgUrl.startsWith('http')) return imgUrl
        } catch (e) { continue }
    }
    return null
}

const handler = {
    help: ['textpro'],
    tags: ['maker', 'tools'],
    command: /^(textpro)$/i,
    group: false,
    admin: false,
    botAdmin: false,
    owner: false,

    execute: async ({ jid, sock, message, args, text }) => {
        try {
            if (!args[0]) {
                const effectList = Object.keys(TEXTPRO_EFFECTS)
                    .map((name, i) => `${i + 1}. *${name}*`)
                    .join('\n')

                return await sock.sendMessage(jid, {
                    text: `╭━━━━━━━━━━━━━━━━━━━━╮
┃   ✨ TEXTPRO.ME     ┃
╰━━━━━━━━━━━━━━━━━━━━╯

*Available Effects (${Object.keys(TEXTPRO_EFFECTS).length}):*

${effectList}

*Usage:*
${config.PREFIX}textpro <effect> <text>

*Example:*
${config.PREFIX}textpro neon Silva MD
${config.PREFIX}textpro glitch Hello World
${config.PREFIX}textpro pornhub Text1|Text2

_Powered by ${config.BOT_NAME}_`
                }, { quoted: message })
            }

            const effectName = args[0].toLowerCase()
            const inputText = args.slice(1).join(' ')

            if (!inputText) {
                return await sock.sendMessage(jid, {
                    text: `❌ Please provide text!\n\nUsage: ${config.PREFIX}textpro ${effectName} <your text>`
                }, { quoted: message })
            }

            const effect = TEXTPRO_EFFECTS[effectName]
            if (!effect) {
                const suggestions = Object.keys(TEXTPRO_EFFECTS)
                    .filter(e => e.includes(effectName) || effectName.includes(e))
                    .slice(0, 5)

                return await sock.sendMessage(jid, {
                    text: `❌ Effect "${effectName}" not found!\n\n${suggestions.length ? `Did you mean: ${suggestions.join(', ')}?\n\n` : ''}Use ${config.PREFIX}textpro to see all effects.`
                }, { quoted: message })
            }

            await sock.sendMessage(jid, {
                react: { text: '⏳', key: message.key }
            })

            const texts = effect.texts === 2 ? inputText.split('|').map(t => t.trim()) : [inputText]

            let imageUrl = await createTextproApi(effectName, texts)

            if (!imageUrl) {
                imageUrl = await createTextpro(effect.url, texts)
            }

            if (!imageUrl) {
                return await sock.sendMessage(jid, {
                    text: `❌ Failed to generate image. Please try again later.`
                }, { quoted: message })
            }

            const { data: imgBuffer } = await axios.get(imageUrl, {
                responseType: 'arraybuffer',
                timeout: 15000,
                headers: { 'User-Agent': 'Mozilla/5.0' }
            })

            await sock.sendMessage(jid, {
                image: Buffer.from(imgBuffer),
                caption: `✨ *TextPro - ${effectName}*\nText: ${inputText}\n\n_Powered by ${config.BOT_NAME}_`
            }, { quoted: message })

            await sock.sendMessage(jid, {
                react: { text: '✅', key: message.key }
            })

        } catch (err) {
            console.error('[TEXTPRO] Error:', err.message)
            await sock.sendMessage(jid, {
                text: `❌ Error: ${err.message}`
            }, { quoted: message })
        }
    }
}

module.exports = { handler }

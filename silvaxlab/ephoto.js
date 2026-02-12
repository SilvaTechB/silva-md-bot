const config = require('../config')
const axios = require('axios')
const cheerio = require('cheerio')

const EPHOTO_EFFECTS = {
    'neon': { url: 'https://en.ephoto360.com/create-neon-light-text-effects-online-797.html', texts: 1 },
    'smoke': { url: 'https://en.ephoto360.com/smoke-text-effect-294.html', texts: 1 },
    'fire': { url: 'https://en.ephoto360.com/fire-text-effect-52.html', texts: 1 },
    'galaxy': { url: 'https://en.ephoto360.com/galaxy-text-effect-online-free-394.html', texts: 1 },
    'thunder': { url: 'https://en.ephoto360.com/thunder-text-effect-online-294.html', texts: 1 },
    'glitch': { url: 'https://en.ephoto360.com/create-impressive-glitch-text-effects-online-766.html', texts: 1 },
    'blackpink': { url: 'https://en.ephoto360.com/create-blackpink-logo-text-effect-online-free-558.html', texts: 1 },
    'metallic': { url: 'https://en.ephoto360.com/create-a-metallic-text-effect-free-online-471.html', texts: 1 },
    'logo3d': { url: 'https://en.ephoto360.com/free-online-3d-logo-design-367.html', texts: 1 },
    'ice': { url: 'https://en.ephoto360.com/create-a-frozen-text-effect-online-240.html', texts: 1 },
    'gold': { url: 'https://en.ephoto360.com/create-3d-golden-text-effect-online-423.html', texts: 1 },
    'neonlight': { url: 'https://en.ephoto360.com/neon-light-text-effect-online-f-524.html', texts: 1 },
    'butterfly': { url: 'https://en.ephoto360.com/create-butterfly-text-effect-online-734.html', texts: 1 },
    'sand': { url: 'https://en.ephoto360.com/create-sand-writing-text-effect-online-free-663.html', texts: 1 },
    'watercolor': { url: 'https://en.ephoto360.com/create-a-watercolor-text-effect-online-795.html', texts: 1 },
    'love': { url: 'https://en.ephoto360.com/love-text-effect-online-189.html', texts: 2 },
    'christmas': { url: 'https://en.ephoto360.com/christmas-text-effect-online-695.html', texts: 1 },
    'horror': { url: 'https://en.ephoto360.com/create-horror-text-effect-online-free-786.html', texts: 1 },
    'shadow': { url: 'https://en.ephoto360.com/create-shadow-text-effect-online-free-554.html', texts: 1 },
    'graffiti': { url: 'https://en.ephoto360.com/create-graffiti-text-on-wall-free-195.html', texts: 1 }
}

async function createEphoto(effectUrl, texts) {
    try {
        const { data: page } = await axios.get(effectUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
            timeout: 15000
        })
        const $ = cheerio.load(page)

        const token = $('input[name="token"]').val()
        const buildServer = $('input[name="build_server"]').val()
        const buildServerId = $('input[name="build_server_id"]').val()

        const formData = new URLSearchParams()
        formData.append('token', token || '')
        formData.append('build_server', buildServer || '')
        formData.append('build_server_id', buildServerId || '')
        texts.forEach((t, i) => formData.append(`text[${i}]`, t))

        const postUrl = effectUrl.replace('.html', '')
        const { data: result } = await axios.post(effectUrl, formData.toString(), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Referer': effectUrl,
                'Cookie': 'PHPSESSID=' + Math.random().toString(36).substring(2)
            },
            timeout: 30000
        })

        const $r = cheerio.load(typeof result === 'string' ? result : '')
        let imageUrl = $r('.thumbnail img').attr('src') || $r('#image_preview img').attr('src') || $r('img.img-responsive').attr('src')

        if (!imageUrl && typeof result === 'object' && result.image) {
            imageUrl = result.image
        }
        if (!imageUrl && typeof result === 'string') {
            const match = result.match(/https?:\/\/[^\s"'<>]+\.(jpg|jpeg|png|webp)/i)
            if (match) imageUrl = match[0]
        }

        if (imageUrl && !imageUrl.startsWith('http')) {
            imageUrl = 'https://en.ephoto360.com' + imageUrl
        }

        return imageUrl
    } catch (e) {
        console.log('[EPHOTO] Direct scrape failed:', e.message)
        return null
    }
}

async function createEphotoApi(effectName, texts) {
    const apis = [
        {
            url: `https://api.nexoracle.com/ephoto360/${effectName}?apikey=free&text=${encodeURIComponent(texts[0])}`,
            extract: (d) => d.result?.image || d.result?.url || d.result
        },
        {
            url: `https://api.ryzendesu.vip/api/maker/ephoto360/${effectName}?text=${encodeURIComponent(texts[0])}`,
            extract: (d) => d.result?.image || d.result?.url || d.url
        }
    ]

    for (const api of apis) {
        try {
            const { data } = await axios.get(api.url, { timeout: 20000 })
            const imgUrl = api.extract(data)
            if (imgUrl) return imgUrl
        } catch (e) { continue }
    }
    return null
}

const handler = {
    help: ['ephoto', 'ephoto360'],
    tags: ['maker', 'tools'],
    command: /^(ephoto|ephoto360)$/i,
    group: false,
    admin: false,
    botAdmin: false,
    owner: false,

    execute: async ({ jid, sock, message, args, text }) => {
        try {
            if (!args[0]) {
                const effectList = Object.keys(EPHOTO_EFFECTS)
                    .map((name, i) => `${i + 1}. *${name}*`)
                    .join('\n')

                return await sock.sendMessage(jid, {
                    text: `╭━━━━━━━━━━━━━━━━━━━━╮
┃   🎨 EPHOTO 360     ┃
╰━━━━━━━━━━━━━━━━━━━━╯

*Available Effects (${Object.keys(EPHOTO_EFFECTS).length}):*

${effectList}

*Usage:*
${config.PREFIX}ephoto <effect> <text>

*Example:*
${config.PREFIX}ephoto neon Silva MD
${config.PREFIX}ephoto fire Hello World

_Powered by ${config.BOT_NAME}_`
                }, { quoted: message })
            }

            const effectName = args[0].toLowerCase()
            const inputText = args.slice(1).join(' ')

            if (!inputText) {
                return await sock.sendMessage(jid, {
                    text: `❌ Please provide text!\n\nUsage: ${config.PREFIX}ephoto ${effectName} <your text>`
                }, { quoted: message })
            }

            const effect = EPHOTO_EFFECTS[effectName]
            if (!effect) {
                const suggestions = Object.keys(EPHOTO_EFFECTS)
                    .filter(e => e.includes(effectName) || effectName.includes(e))
                    .slice(0, 5)

                return await sock.sendMessage(jid, {
                    text: `❌ Effect "${effectName}" not found!\n\n${suggestions.length ? `Did you mean: ${suggestions.join(', ')}?\n\n` : ''}Use ${config.PREFIX}ephoto to see all effects.`
                }, { quoted: message })
            }

            await sock.sendMessage(jid, {
                react: { text: '⏳', key: message.key }
            })

            const texts = effect.texts === 2 ? inputText.split('|').map(t => t.trim()) : [inputText]

            let imageUrl = await createEphotoApi(effectName, texts)

            if (!imageUrl) {
                imageUrl = await createEphoto(effect.url, texts)
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
                caption: `🎨 *Ephoto360 - ${effectName}*\nText: ${inputText}\n\n_Powered by ${config.BOT_NAME}_`
            }, { quoted: message })

            await sock.sendMessage(jid, {
                react: { text: '✅', key: message.key }
            })

        } catch (err) {
            console.error('[EPHOTO] Error:', err.message)
            await sock.sendMessage(jid, {
                text: `❌ Error: ${err.message}`
            }, { quoted: message })
        }
    }
}

module.exports = { handler }

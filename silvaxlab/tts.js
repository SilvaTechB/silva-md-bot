const config = require('../config')

const handler = {
    help: ['tts', 'say'],
    tags: ['utility'],
    command: /^(tts|say)$/i,
    group: false,
    admin: false,
    botAdmin: false,
    owner: false,

    execute: async ({ jid, sock, message, args }) => {
        try {
            const text = args.join(' ').trim()
            
            if (!text) {
                return sock.sendMessage(jid, {
                    text: `╭━━━━━━━━━━━━━━━━━━━━╮
┃   🗣️ TEXT TO SPEECH  ┃
╰━━━━━━━━━━━━━━━━━━━━╯

*Usage:*
${config.PREFIX}tts <text>
${config.PREFIX}tts en hello world
${config.PREFIX}say buenos dias

*Supported Languages:*
en, es, fr, de, pt, it, ja, ko, zh, ar, hi, ru, sw

_Default language: en_`
                }, { quoted: message })
            }

            const langCodes = ['en', 'es', 'fr', 'de', 'pt', 'it', 'ja', 'ko', 'zh', 'ar', 'hi', 'ru', 'sw', 'id', 'tr', 'nl', 'pl', 'vi', 'th']
            let lang = 'en'
            let ttsText = text

            const firstWord = args[0]?.toLowerCase()
            if (langCodes.includes(firstWord) && args.length > 1) {
                lang = firstWord
                ttsText = args.slice(1).join(' ')
            }

            if (ttsText.length > 500) {
                ttsText = ttsText.substring(0, 500)
            }

            const encodedText = encodeURIComponent(ttsText)
            const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodedText}&tl=${lang}&client=tw-ob`

            await sock.sendMessage(jid, {
                audio: { url: ttsUrl },
                mimetype: 'audio/mpeg',
                ptt: true,
                contextInfo: {
                    externalAdReply: {
                        title: `🗣️ TTS: ${lang.toUpperCase()}`,
                        body: ttsText.substring(0, 50),
                        sourceUrl: 'https://github.com/SilvaTechB/silva-md-bot',
                        mediaType: 1,
                    }
                }
            }, { quoted: message })

        } catch (err) {
            await sock.sendMessage(jid, {
                text: `❌ TTS Error: ${err.message}\n\nTry again with shorter text.`
            }, { quoted: message })
        }
    }
}

module.exports = { handler }

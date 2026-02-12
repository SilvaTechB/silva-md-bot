const config = require('../config')
const https = require('https')

const handler = {
    help: ['gpt', 'chatgpt', 'ask'],
    tags: ['ai'],
    command: /^(gpt|chatgpt|ask)$/i,
    group: false,
    admin: false,
    botAdmin: false,
    owner: false,

    execute: async ({ jid, sock, message, args }) => {
        try {
            const sender = message.key.participant || message.key.remoteJid
            const query = args.join(' ').trim()

            if (!query) {
                return sock.sendMessage(jid, {
                    text: `╭━━━━━━━━━━━━━━━━━━━━╮
┃   🤖 SILVA GPT       ┃
╰━━━━━━━━━━━━━━━━━━━━╯

*Usage:*
${config.PREFIX}gpt <question>
${config.PREFIX}ask <question>

*Examples:*
${config.PREFIX}gpt What is quantum computing?
${config.PREFIX}ask Write a poem about nature
${config.PREFIX}gpt Explain machine learning simply

_Powered by AI_`
                }, { quoted: message })
            }

            await sock.sendMessage(jid, {
                react: { text: '⏳', key: message.key }
            })

            const response = await fetchAI(query)

            await sock.sendMessage(jid, {
                react: { text: '✅', key: message.key }
            })

            await sock.sendMessage(jid, {
                text: `╭━━━━━━━━━━━━━━━━━━━━╮
┃   🤖 SILVA GPT       ┃
╰━━━━━━━━━━━━━━━━━━━━╯

${response}

_🤖 Silva MD AI Engine_`,
                contextInfo: {
                    mentionedJid: [sender],
                    forwardingScore: 999,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: '120363200367779016@newsletter',
                        newsletterName: 'SILVA MD • AI',
                        serverMessageId: Math.floor(Math.random() * 1000)
                    }
                }
            }, { quoted: message })

        } catch (err) {
            await sock.sendMessage(jid, {
                text: `❌ AI Error: ${err.message}\n\nPlease try again.`
            }, { quoted: message })
        }
    }
}

function fetchAI(query) {
    return new Promise((resolve, reject) => {
        const apiUrl = `https://api.siputzx.my.id/api/ai/deepseek-r1?content=${encodeURIComponent(query)}`
        
        https.get(apiUrl, (res) => {
            let data = ''
            res.on('data', chunk => data += chunk)
            res.on('end', () => {
                try {
                    const json = JSON.parse(data)
                    if (json.data || json.result || json.answer || json.response) {
                        resolve(json.data || json.result || json.answer || json.response)
                    } else if (json.status && json.data) {
                        resolve(json.data)
                    } else {
                        resolve(JSON.stringify(json, null, 2).substring(0, 2000))
                    }
                } catch (e) {
                    if (data.length > 10) {
                        resolve(data.substring(0, 2000))
                    } else {
                        reject(new Error('AI service unavailable'))
                    }
                }
            })
            res.on('error', reject)
        }).on('error', reject)
    })
}

module.exports = { handler }

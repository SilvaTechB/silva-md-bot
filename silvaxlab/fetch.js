// URL Fetch Plugin - Silva MD Bot (Fixed)
const axios = require('axios')
const config = require('../config')

const handler = {
    help: ['get', 'fetch'],
    tags: ['tools'],
    command: /^(fetch|get)$/i,
    group: false,
    admin: false,
    botAdmin: false,
    owner: false,

    execute: async ({ jid, sock, message, args }) => {
        const sender = message.key.participant || message.key.remoteJid
        
        try {
            // Extract URL from args or quoted message
            let url = args.join(' ').trim()
            
            if (!url && message.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
                const quoted = message.message.extendedTextMessage.contextInfo.quotedMessage
                url = quoted.conversation || quoted.extendedTextMessage?.text || ''
            }

            // Validate URL
            if (!url) {
                return sock.sendMessage(jid, {
                    text: `┏━━━━━━━━━━━━━━━━━━━━┓
┃   ᴜʀʟ ғᴇᴛᴄʜᴇʀ       ┃
┗━━━━━━━━━━━━━━━━━━━━┛

ᴜsᴀɢᴇ:
${config.PREFIX}fetch <url>

ᴇxᴀᴍᴘʟᴇs:
${config.PREFIX}fetch https://example.com
${config.PREFIX}get https://api.github.com/users/github

💡 Reply to a message containing URL with:
${config.PREFIX}fetch`,
                    contextInfo: createContext(sender, 'SILVA MD • FETCH')
                }, { quoted: message })
            }

            // Clean and validate URL
            url = url.trim()
            
            if (!/^https?:\/\//i.test(url)) {
                return sock.sendMessage(jid, {
                    text: `❌ Invalid URL format

URL must start with http:// or https://

Example: https://example.com`,
                    contextInfo: createContext(sender, 'SILVA MD • FETCH')
                }, { quoted: message })
            }

            // Send processing message
            await sock.sendMessage(jid, {
                text: '⏳ Fetching URL...',
                contextInfo: createContext(sender, 'SILVA MD • FETCH')
            }, { quoted: message })

            console.log('[FETCH] Fetching URL:', url)

            // Fetch with timeout and proper headers
            const response = await axios.get(url, {
                responseType: 'arraybuffer',
                timeout: 30000, // 30 seconds
                maxContentLength: 100 * 1024 * 1024, // 100MB
                maxBodyLength: 100 * 1024 * 1024,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': '*/*',
                    'Accept-Language': 'en-US,en;q=0.9',
                    'Accept-Encoding': 'gzip, deflate, br'
                },
                validateStatus: (status) => status < 500 // Accept any status < 500
            })

            console.log('[FETCH] Status:', response.status)
            console.log('[FETCH] Content-Type:', response.headers['content-type'])

            const contentType = response.headers['content-type'] || ''
            const contentLength = parseInt(response.headers['content-length'] || response.data.length)

            console.log('[FETCH] Content-Length:', contentLength)

            // Check file size
            if (contentLength > 100 * 1024 * 1024) {
                return sock.sendMessage(jid, {
                    text: `❌ File too large!

Size: ${(contentLength / 1024 / 1024).toFixed(2)} MB
Max: 100 MB

💡 Try a smaller file`,
                    contextInfo: createContext(sender, 'SILVA MD • FETCH')
                }, { quoted: message })
            }

            // Handle different content types
            if (contentType.includes('image/')) {
                // Send as image
                console.log('[FETCH] Sending as image')
                await sock.sendMessage(jid, {
                    image: response.data,
                    caption: `📸 Image from: ${url}\n\nSize: ${(contentLength / 1024).toFixed(2)} KB`,
                    contextInfo: createContext(sender, 'SILVA MD • FETCH')
                }, { quoted: message })
            } else if (contentType.includes('video/')) {
                // Send as video
                console.log('[FETCH] Sending as video')
                await sock.sendMessage(jid, {
                    video: response.data,
                    caption: `🎥 Video from: ${url}\n\nSize: ${(contentLength / 1024 / 1024).toFixed(2)} MB`,
                    contextInfo: createContext(sender, 'SILVA MD • FETCH')
                }, { quoted: message })
            } else if (contentType.includes('audio/')) {
                // Send as audio
                console.log('[FETCH] Sending as audio')
                await sock.sendMessage(jid, {
                    audio: response.data,
                    mimetype: contentType,
                    contextInfo: createContext(sender, 'SILVA MD • FETCH')
                }, { quoted: message })
            } else if (contentType.includes('text/') || contentType.includes('json') || contentType.includes('javascript') || contentType.includes('xml')) {
                // Send as text
                console.log('[FETCH] Sending as text')
                
                let text = response.data.toString('utf-8')

                // Try to format JSON
                if (contentType.includes('json')) {
                    try {
                        const json = JSON.parse(text)
                        text = JSON.stringify(json, null, 2)
                    } catch (e) {
                        console.log('[FETCH] JSON parse failed:', e.message)
                    }
                }

                // Limit text length
                if (text.length > 65000) {
                    text = text.substring(0, 65000) + '\n\n... (truncated)'
                }

                await sock.sendMessage(jid, {
                    text: `┏━━━━━━━━━━━━━━━━━━━━┓
┃   ғᴇᴛᴄʜᴇᴅ ᴄᴏɴᴛᴇɴᴛ  ┃
┗━━━━━━━━━━━━━━━━━━━━┛

📄 URL: ${url}
📦 Type: ${contentType.split(';')[0]}
📊 Size: ${(contentLength / 1024).toFixed(2)} KB

━━━━━━━━━━━━━━━━━━━━

${text}

━━━━━━━━━━━━━━━━━━━━
⚡ sɪʟᴠᴀ ᴍᴅ`,
                    contextInfo: createContext(sender, 'SILVA MD • FETCH')
                }, { quoted: message })
            } else {
                // Send as document
                console.log('[FETCH] Sending as document')
                
                const fileName = url.split('/').pop().split('?')[0] || 'download'
                const ext = fileName.includes('.') ? '' : '.bin'
                
                await sock.sendMessage(jid, {
                    document: response.data,
                    fileName: fileName + ext,
                    mimetype: contentType || 'application/octet-stream',
                    caption: `📎 File from: ${url}\n\nType: ${contentType}\nSize: ${(contentLength / 1024 / 1024).toFixed(2)} MB`,
                    contextInfo: createContext(sender, 'SILVA MD • FETCH')
                }, { quoted: message })
            }

            console.log('[FETCH] Success!')

        } catch (error) {
            console.error('[FETCH] Error:', error.message)
            console.error('[FETCH] Stack:', error.stack)
            
            let errorMessage = '❌ Failed to fetch URL\n\n'
            
            if (error.code === 'ENOTFOUND') {
                errorMessage += 'Domain not found. Check the URL.'
            } else if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
                errorMessage += 'Request timeout. Server took too long to respond.'
            } else if (error.response) {
                errorMessage += `Server returned status: ${error.response.status}\n`
                errorMessage += `Message: ${error.response.statusText || 'Unknown error'}`
            } else if (error.request) {
                errorMessage += 'No response from server. Check your connection.'
            } else {
                errorMessage += error.message || 'Unknown error occurred'
            }
            
            errorMessage += '\n\n💡 Possible solutions:'
            errorMessage += '\n• Check if URL is correct'
            errorMessage += '\n• Ensure URL is accessible'
            errorMessage += '\n• Try a different URL'
            errorMessage += '\n• Check your internet connection'

            await sock.sendMessage(jid, {
                text: errorMessage,
                contextInfo: createContext(sender, 'SILVA MD • ERROR')
            }, { quoted: message })
        }
    }
}

// Helper function for context info
function createContext(sender, name) {
    return {
        mentionedJid: [sender],
        forwardingScore: 999,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
            newsletterJid: '120363200367779016@newsletter',
            newsletterName: name,
            serverMessageId: Math.floor(Math.random() * 1000)
        }
    }
}

module.exports = { handler }
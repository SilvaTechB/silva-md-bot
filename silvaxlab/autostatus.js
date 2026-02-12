// Auto Status View, React & Reply Plugin
const config = require('../config')

const handler = {
    help: ['autostatus'],
    tags: ['status'],
    command: /^(autostatus)$/i,
    
    // This runs on every status update
    statusHandler: async ({ sock, message }) => {
        try {
            // Check if it's a status update
            const isStatus = message.key.remoteJid === 'status@broadcast'
            if (!isStatus) return

            const sender = message.key.participant
            const statusType = message.message?.imageMessage ? 'image' :
                             message.message?.videoMessage ? 'video' :
                             message.message?.extendedTextMessage ? 'text' : 'media'

            // Auto View Status
            if (config.AUTO_STATUS_SEEN === 'true' || config.AUTO_STATUS_SEEN === true) {
                await sock.readMessages([message.key])
                console.log(`✅ Auto-viewed status from: ${sender}`)
            }

            // Auto React to Status
            if (config.AUTO_STATUS_REACT === 'true' || config.AUTO_STATUS_REACT === true) {
                const emojis = config.CUSTOM_REACT_EMOJIS 
                    ? config.CUSTOM_REACT_EMOJIS.split(',').map(e => e.trim())
                    : ['❤️', '🔥', '💯', '😍', '👏']
                
                const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)]
                
                await sock.sendMessage('status@broadcast', {
                    react: {
                        text: randomEmoji,
                        key: message.key
                    }
                })
                console.log(`${randomEmoji} Reacted to status from: ${sender}`)
            }

            // Auto Reply to Status
            if (config.AUTO_STATUS_REPLY === 'true' || config.AUTO_STATUS_REPLY === true) {
                const replyMsg = config.AUTO_STATUS_MSG || config.STATUS_MSG || '✅ Status viewed by Silva MD'
                
                // Wait a bit to seem more natural
                await new Promise(resolve => setTimeout(resolve, 2000))
                
                await sock.sendMessage('status@broadcast', {
                    text: replyMsg
                }, {
                    quoted: message
                })
                console.log(`💬 Replied to status from: ${sender}`)
            }

            // Save Status (download media)
            if (config.Status_Saver === 'true' || config.Status_Saver === true) {
                if (message.message?.imageMessage || message.message?.videoMessage) {
                    try {
                        const buffer = await sock.downloadMediaMessage(message)
                        const fileName = `status_${Date.now()}.${statusType === 'image' ? 'jpg' : 'mp4'}`
                        
                        // You can implement your own storage logic here
                        // For example: save to disk, upload to cloud, etc.
                        console.log(`💾 Saved status: ${fileName}`)
                        
                        // Optionally forward to owner
                        if (config.OWNER_NUMBER) {
                            await sock.sendMessage(config.OWNER_NUMBER + '@s.whatsapp.net', {
                                [statusType]: buffer,
                                caption: `📥 Status from: ${sender.split('@')[0]}\n\nSaved by Silva MD`
                            })
                        }
                    } catch (err) {
                        console.error('Error saving status:', err)
                    }
                }
            }

        } catch (error) {
            console.error('Status handler error:', error)
        }
    },

    // Manual command to check status settings
    execute: async ({ jid, sock, message }) => {
        try {
            const statusConfig = `
┏━━━━━━━━━━━━━━━━━━━━┓
┃ sᴛᴀᴛᴜs sᴇᴛᴛɪɴɢs  ┃
┗━━━━━━━━━━━━━━━━━━━━┛

┏─『 ᴄᴜʀʀᴇɴᴛ sᴛᴀᴛᴜs 』──⊷
│ ᴀᴜᴛᴏ ᴠɪᴇᴡ: ${config.AUTO_STATUS_SEEN === 'true' || config.AUTO_STATUS_SEEN === true ? '✅ ON' : '❌ OFF'}
│ ᴀᴜᴛᴏ ʀᴇᴀᴄᴛ: ${config.AUTO_STATUS_REACT === 'true' || config.AUTO_STATUS_REACT === true ? '✅ ON' : '❌ OFF'}
│ ᴀᴜᴛᴏ ʀᴇᴘʟʏ: ${config.AUTO_STATUS_REPLY === 'true' || config.AUTO_STATUS_REPLY === true ? '✅ ON' : '❌ OFF'}
│ sᴛᴀᴛᴜs sᴀᴠᴇʀ: ${config.Status_Saver === 'true' || config.Status_Saver === true ? '✅ ON' : '❌ OFF'}
┗──────────────⊷

┏─『 ᴍᴇssᴀɢᴇs 』──⊷
│ ${config.AUTO_STATUS_MSG || config.STATUS_MSG || '✅ Status viewed'}
┗──────────────⊷

┏─『 ʀᴇᴀᴄᴛ ᴇᴍᴏᴊɪs 』──⊷
│ ${config.CUSTOM_REACT_EMOJIS || '❤️,🔥,💯,😍,👏'}
┗──────────────⊷

💡 Edit config.js to change settings
`

            await sock.sendMessage(jid, {
                text: statusConfig
            }, { quoted: message })

        } catch (error) {
            await sock.sendMessage(jid, {
                text: `❌ Error: ${error.message}`
            }, { quoted: message })
        }
    }
}

module.exports = { handler }

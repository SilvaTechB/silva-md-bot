// Chat Moderation Plugin - Silva MD Bot
const config = require('../config')
const fs = require('fs')
const axios = require('axios')

const handler = {
    help: ['archive', 'unarchive', 'mute', 'unmute', 'pin', 'unpin', 'markread', 'markunread', 
           'setbio', 'setname', 'setpp', 'removepp', 'checknum', 'fetchstatus', 'getpp', 
           'disappear'],
    tags: ['chat', 'moderation'],
    command: /^(archive|unarchive|mute|unmute|pin|unpin|markread|markunread|setbio|setname|setpp|removepp|checknum|fetchstatus|getpp|disappear)$/i,
    group: false,
    admin: false,
    botAdmin: true,
    owner: true,

    execute: async ({ jid, sock, message, args }) => {
        const sender = message.key.participant || message.key.remoteJid
        const cmd = message.message?.conversation || 
                   message.message?.extendedTextMessage?.text || ''
        const command = cmd.split(' ')[0].replace(config.PREFIX, '').toLowerCase()

        try {
            switch(command) {
                // ========================================
                // ARCHIVE CHAT
                // ========================================
                case 'archive':
                    try {
                        // Try without lastMessages first
                        await sock.chatModify({ archive: true }, jid)
                        await sock.sendMessage(jid, {
                            text: '📦 Chat archived successfully!',
                            contextInfo: createContext(sender, 'SILVA MD • CHAT')
                        }, { quoted: message })
                    } catch (error) {
                        // If it fails, provide helpful message
                        await sock.sendMessage(jid, {
                            text: `⚠️ Archive feature not available\n\nThis might be because:\n• App state not fully synced\n• Feature not supported in this chat\n\nError: ${error.message}`,
                            contextInfo: createContext(sender, 'SILVA MD • CHAT')
                        }, { quoted: message })
                    }
                    break

                // ========================================
                // UNARCHIVE CHAT
                // ========================================
                case 'unarchive':
                    try {
                        await sock.chatModify({ archive: false }, jid)
                        await sock.sendMessage(jid, {
                            text: '📂 Chat unarchived successfully!',
                            contextInfo: createContext(sender, 'SILVA MD • CHAT')
                        }, { quoted: message })
                    } catch (error) {
                        throw new Error(`Failed to unarchive: ${error.message}`)
                    }
                    break

                // ========================================
                // MUTE CHAT
                // ========================================
                case 'mute':
                    const muteDuration = args[0]
                    let muteTime = 8 * 60 * 60 * 1000 // 8 hours default

                    if (muteDuration) {
                        if (muteDuration === '8h') muteTime = 8 * 60 * 60 * 1000
                        else if (muteDuration === '7d') muteTime = 7 * 24 * 60 * 60 * 1000
                        else if (muteDuration === '1y') muteTime = 365 * 24 * 60 * 60 * 1000
                    }

                    try {
                        await sock.chatModify({ mute: muteTime }, jid)
                        await sock.sendMessage(jid, {
                            text: `🔇 Chat muted for ${muteDuration || '8h'}`,
                            contextInfo: createContext(sender, 'SILVA MD • CHAT')
                        }, { quoted: message })
                    } catch (error) {
                        await sock.sendMessage(jid, {
                            text: `⚠️ Mute feature not available\n\nYou can manually mute this chat from WhatsApp settings.\n\nError: ${error.message}`,
                            contextInfo: createContext(sender, 'SILVA MD • CHAT')
                        }, { quoted: message })
                    }
                    break

                // ========================================
                // UNMUTE CHAT
                // ========================================
                case 'unmute':
                    try {
                        await sock.chatModify({ mute: null }, jid)
                        await sock.sendMessage(jid, {
                            text: '🔊 Chat unmuted successfully!',
                            contextInfo: createContext(sender, 'SILVA MD • CHAT')
                        }, { quoted: message })
                    } catch (error) {
                        throw new Error(`Failed to unmute: ${error.message}`)
                    }
                    break

                // ========================================
                // PIN CHAT
                // ========================================
                case 'pin':
                    try {
                        await sock.chatModify({ pin: true }, jid)
                        await sock.sendMessage(jid, {
                            text: '📌 Chat pinned successfully!',
                            contextInfo: createContext(sender, 'SILVA MD • CHAT')
                        }, { quoted: message })
                    } catch (error) {
                        await sock.sendMessage(jid, {
                            text: `⚠️ Pin feature not available\n\nYou can manually pin this chat from WhatsApp.\n\nError: ${error.message}`,
                            contextInfo: createContext(sender, 'SILVA MD • CHAT')
                        }, { quoted: message })
                    }
                    break

                // ========================================
                // UNPIN CHAT
                // ========================================
                case 'unpin':
                    try {
                        await sock.chatModify({ pin: false }, jid)
                        await sock.sendMessage(jid, {
                            text: '📍 Chat unpinned successfully!',
                            contextInfo: createContext(sender, 'SILVA MD • CHAT')
                        }, { quoted: message })
                    } catch (error) {
                        throw new Error(`Failed to unpin: ${error.message}`)
                    }
                    break

                // ========================================
                // MARK CHAT AS READ
                // ========================================
                case 'markread':
                    try {
                        await sock.chatModify({ markRead: true }, jid)
                        await sock.sendMessage(jid, {
                            text: '✅ Chat marked as read!',
                            contextInfo: createContext(sender, 'SILVA MD • CHAT')
                        }, { quoted: message })
                    } catch (error) {
                        throw new Error(`Failed to mark read: ${error.message}`)
                    }
                    break

                // ========================================
                // MARK CHAT AS UNREAD
                // ========================================
                case 'markunread':
                    try {
                        await sock.chatModify({ markRead: false }, jid)
                        await sock.sendMessage(jid, {
                            text: '📬 Chat marked as unread!',
                            contextInfo: createContext(sender, 'SILVA MD • CHAT')
                        }, { quoted: message })
                    } catch (error) {
                        throw new Error(`Failed to mark unread: ${error.message}`)
                    }
                    break

                // ========================================
                // SET BIO/STATUS
                // ========================================
                case 'setbio':
                    if (!args[0]) {
                        return sock.sendMessage(jid, {
                            text: `┏━━━━━━━━━━━━━━━━━━━━┓
┃   sᴇᴛ ʙɪᴏ          ┃
┗━━━━━━━━━━━━━━━━━━━━┛

ᴜsᴀɢᴇ:
${config.PREFIX}setbio <text>

ᴇxᴀᴍᴘʟᴇ:
${config.PREFIX}setbio Hey there! I am using Silva MD`,
                            contextInfo: createContext(sender, 'SILVA MD • PROFILE')
                        }, { quoted: message })
                    }

                    const newBio = args.join(' ')
                    try {
                        await sock.updateProfileStatus(newBio)
                        await sock.sendMessage(jid, {
                            text: `✅ Profile status updated!\n\n📝 New bio: ${newBio}`,
                            contextInfo: createContext(sender, 'SILVA MD • PROFILE')
                        }, { quoted: message })
                    } catch (error) {
                        throw new Error(`Failed to update bio: ${error.message}`)
                    }
                    break

                // ========================================
                // SET NAME
                // ========================================
                case 'setname':
                    if (!args[0]) {
                        return sock.sendMessage(jid, {
                            text: `┏━━━━━━━━━━━━━━━━━━━━┓
┃   sᴇᴛ ɴᴀᴍᴇ         ┃
┗━━━━━━━━━━━━━━━━━━━━┛

ᴜsᴀɢᴇ:
${config.PREFIX}setname <name>

ᴇxᴀᴍᴘʟᴇ:
${config.PREFIX}setname Silva Bot`,
                            contextInfo: createContext(sender, 'SILVA MD • PROFILE')
                        }, { quoted: message })
                    }

                    const newName = args.join(' ')
                    try {
                        await sock.updateProfileName(newName)
                        await sock.sendMessage(jid, {
                            text: `✅ Profile name updated!\n\n👤 New name: ${newName}`,
                            contextInfo: createContext(sender, 'SILVA MD • PROFILE')
                        }, { quoted: message })
                    } catch (error) {
                        throw new Error(`Failed to update name: ${error.message}`)
                    }
                    break

                // ========================================
                // SET PROFILE PICTURE
                // ========================================
                case 'setpp':
                    const quoted = message.message?.extendedTextMessage?.contextInfo
                    if (!quoted?.quotedMessage?.imageMessage) {
                        return sock.sendMessage(jid, {
                            text: `┏━━━━━━━━━━━━━━━━━━━━┓
┃   sᴇᴛ ᴘʀᴏғɪʟᴇ ᴘɪᴄ ┃
┗━━━━━━━━━━━━━━━━━━━━┛

📸 Reply to an image with:
${config.PREFIX}setpp

💡 Works for personal and group profiles`,
                            contextInfo: createContext(sender, 'SILVA MD • PROFILE')
                        }, { quoted: message })
                    }

                    try {
                        const media = await sock.downloadMediaMessage(
                            { message: quoted.quotedMessage },
                            'buffer'
                        )

                        const targetJid = args[0] && args[0].endsWith('@g.us') ? args[0] : 
                                        jid.endsWith('@g.us') ? jid : sock.user.id.split(':')[0] + '@s.whatsapp.net'

                        await sock.updateProfilePicture(targetJid, media)
                        await sock.sendMessage(jid, {
                            text: '✅ Profile picture updated successfully!',
                            contextInfo: createContext(sender, 'SILVA MD • PROFILE')
                        }, { quoted: message })
                    } catch (error) {
                        throw new Error(`Failed to update profile picture: ${error.message}`)
                    }
                    break

                // ========================================
                // REMOVE PROFILE PICTURE
                // ========================================
                case 'removepp':
                    try {
                        const targetJid = args[0] && args[0].endsWith('@g.us') ? args[0] : 
                                        jid.endsWith('@g.us') ? jid : sock.user.id.split(':')[0] + '@s.whatsapp.net'

                        await sock.removeProfilePicture(targetJid)
                        await sock.sendMessage(jid, {
                            text: '✅ Profile picture removed successfully!',
                            contextInfo: createContext(sender, 'SILVA MD • PROFILE')
                        }, { quoted: message })
                    } catch (error) {
                        throw new Error(`Failed to remove profile picture: ${error.message}`)
                    }
                    break

                // ========================================
                // CHECK IF NUMBER EXISTS
                // ========================================
                case 'checknum':
                    if (!args[0]) {
                        return sock.sendMessage(jid, {
                            text: `┏━━━━━━━━━━━━━━━━━━━━┓
┃   ᴄʜᴇᴄᴋ ɴᴜᴍʙᴇʀ     ┃
┗━━━━━━━━━━━━━━━━━━━━┛

ᴜsᴀɢᴇ:
${config.PREFIX}checknum <number>

ᴇxᴀᴍᴘʟᴇ:
${config.PREFIX}checknum 254700000000`,
                            contextInfo: createContext(sender, 'SILVA MD • TOOLS')
                        }, { quoted: message })
                    }

                    const number = args[0].replace(/[^0-9]/g, '')
                    try {
                        const [result] = await sock.onWhatsApp(number + '@s.whatsapp.net')
                        
                        if (result && result.exists) {
                            await sock.sendMessage(jid, {
                                text: `┏━━━━━━━━━━━━━━━━━━━━┓
┃   ɴᴜᴍʙᴇʀ ᴄʜᴇᴄᴋ     ┃
┗━━━━━━━━━━━━━━━━━━━━┛

✅ Number exists on WhatsApp!

📱 Number: ${number}
🆔 JID: ${result.jid}
📧 Business: ${result.isBusiness ? 'Yes' : 'No'}`,
                                contextInfo: createContext(sender, 'SILVA MD • TOOLS')
                            }, { quoted: message })
                        } else {
                            await sock.sendMessage(jid, {
                                text: `❌ Number ${number} does not exist on WhatsApp`,
                                contextInfo: createContext(sender, 'SILVA MD • TOOLS')
                            }, { quoted: message })
                        }
                    } catch (error) {
                        throw new Error(`Failed to check number: ${error.message}`)
                    }
                    break

                // ========================================
                // FETCH STATUS
                // ========================================
                case 'fetchstatus':
                    const targetNum = args[0] ? args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net' : sender
                    
                    try {
                        const status = await sock.fetchStatus(targetNum)
                        const statusText = typeof status === 'string' ? status : 
                                         status?.status || 
                                         'No status set'
                        
                        await sock.sendMessage(jid, {
                            text: `┏━━━━━━━━━━━━━━━━━━━━┓
┃   sᴛᴀᴛᴜs ɪɴғᴏ      ┃
┗━━━━━━━━━━━━━━━━━━━━┛

📱 Number: ${targetNum.split('@')[0]}
💬 Status: ${statusText}`,
                            contextInfo: createContext(sender, 'SILVA MD • TOOLS')
                        }, { quoted: message })
                    } catch (error) {
                        throw new Error(`Failed to fetch status: ${error.message}`)
                    }
                    break

                // ========================================
                // GET PROFILE PICTURE
                // ========================================
                case 'getpp':
                    const ppTarget = args[0] ? args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net' : sender
                    
                    try {
                        let ppUrl
                        try {
                            ppUrl = await sock.profilePictureUrl(ppTarget, 'image')
                        } catch {
                            ppUrl = 'https://i.imgur.com/whjlJSf.jpg' // Default avatar
                        }

                        await sock.sendMessage(jid, {
                            image: { url: ppUrl },
                            caption: `┏━━━━━━━━━━━━━━━━━━━━┓
┃   ᴘʀᴏғɪʟᴇ ᴘɪᴄᴛᴜʀᴇ  ┃
┗━━━━━━━━━━━━━━━━━━━━┛

📱 Number: ${ppTarget.split('@')[0]}

⚡ sɪʟᴠᴀ ᴍᴅ`,
                            contextInfo: createContext(sender, 'SILVA MD • TOOLS')
                        }, { quoted: message })
                    } catch (error) {
                        throw new Error(`Failed to get profile picture: ${error.message}`)
                    }
                    break

                // ========================================
                // DISAPPEARING MESSAGES
                // ========================================
                case 'disappear':
                    const duration = args[0]
                    let ephemeral

                    if (!duration || duration === 'off') {
                        ephemeral = false
                    } else if (duration === '24h') {
                        ephemeral = 86400
                    } else if (duration === '7d') {
                        ephemeral = 604800
                    } else if (duration === '90d') {
                        ephemeral = 7776000
                    } else {
                        return sock.sendMessage(jid, {
                            text: `┏━━━━━━━━━━━━━━━━━━━━┓
┃   ᴅɪsᴀᴘᴘᴇᴀʀ ᴍᴏᴅᴇ   ┃
┗━━━━━━━━━━━━━━━━━━━━┛

ᴜsᴀɢᴇ:
${config.PREFIX}disappear <time>

ᴏᴘᴛɪᴏɴs:
• 24h - 24 hours
• 7d - 7 days
• 90d - 90 days
• off - Disable

ᴇxᴀᴍᴘʟᴇ:
${config.PREFIX}disappear 7d`,
                            contextInfo: createContext(sender, 'SILVA MD • CHAT')
                        }, { quoted: message })
                    }

                    try {
                        await sock.sendMessage(jid, {
                            disappearingMessagesInChat: ephemeral
                        })
                        
                        const statusMsg = ephemeral ? `✅ Disappearing messages enabled for ${duration}` : 
                                        '❌ Disappearing messages disabled'
                        
                        await sock.sendMessage(jid, {
                            text: statusMsg,
                            contextInfo: createContext(sender, 'SILVA MD • CHAT')
                        }, { quoted: message })
                    } catch (error) {
                        throw new Error(`Failed to set disappearing messages: ${error.message}`)
                    }
                    break

                default:
                    await sock.sendMessage(jid, {
                        text: '❌ Unknown command',
                        contextInfo: createContext(sender, 'SILVA MD • ERROR')
                    }, { quoted: message })
            }

        } catch (error) {
            await sock.sendMessage(jid, {
                text: `┏━━━━━━━━━━━━━━━━━━━━┓
┃   ᴇʀʀᴏʀ            ┃
┗━━━━━━━━━━━━━━━━━━━━┛

❌ ${error.message}

💡 Make sure you have permission to perform this action`,
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

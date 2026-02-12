// Privacy Settings Plugin - Silva MD Bot
const config = require('../config')

const handler = {
    help: ['block', 'unblock', 'blocklist', 'privacy', 'privacylastseen', 'privacyonline', 
           'privacypp', 'privacystatus', 'privacyread', 'privacygroup', 'disappeardefault'],
    tags: ['privacy', 'settings'],
    command: /^(block|unblock|blocklist|privacy|privacylastseen|privacyonline|privacypp|privacystatus|privacyread|privacygroup|disappeardefault)$/i,
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
                // BLOCK USER
                // ========================================
                case 'block':
                    const mentions1 = message.message?.extendedTextMessage?.contextInfo?.mentionedJid || []
                    const blockNum = args[0] ? args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net' : null
                    
                    const toBlock = mentions1[0] || blockNum
                    
                    if (!toBlock) {
                        return sock.sendMessage(jid, {
                            text: `┏━━━━━━━━━━━━━━━━━━━━┓
┃   ʙʟᴏᴄᴋ ᴜsᴇʀ       ┃
┗━━━━━━━━━━━━━━━━━━━━┛

ᴜsᴀɢᴇ:
${config.PREFIX}block @user
${config.PREFIX}block 254700000000

💡 Tag user or provide number`,
                            contextInfo: createContext(sender, 'SILVA MD • PRIVACY')
                        }, { quoted: message })
                    }

                    try {
                        await sock.updateBlockStatus(toBlock, 'block')
                        await sock.sendMessage(jid, {
                            text: `✅ Blocked: @${toBlock.split('@')[0]}`,
                            mentions: [toBlock],
                            contextInfo: createContext(sender, 'SILVA MD • PRIVACY')
                        }, { quoted: message })
                    } catch (error) {
                        throw new Error(`Failed to block: ${error.message}`)
                    }
                    break

                // ========================================
                // UNBLOCK USER
                // ========================================
                case 'unblock':
                    const mentions2 = message.message?.extendedTextMessage?.contextInfo?.mentionedJid || []
                    const unblockNum = args[0] ? args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net' : null
                    
                    const toUnblock = mentions2[0] || unblockNum
                    
                    if (!toUnblock) {
                        return sock.sendMessage(jid, {
                            text: `┏━━━━━━━━━━━━━━━━━━━━┓
┃   ᴜɴʙʟᴏᴄᴋ ᴜsᴇʀ     ┃
┗━━━━━━━━━━━━━━━━━━━━┛

ᴜsᴀɢᴇ:
${config.PREFIX}unblock @user
${config.PREFIX}unblock 254700000000`,
                            contextInfo: createContext(sender, 'SILVA MD • PRIVACY')
                        }, { quoted: message })
                    }

                    try {
                        await sock.updateBlockStatus(toUnblock, 'unblock')
                        await sock.sendMessage(jid, {
                            text: `✅ Unblocked: @${toUnblock.split('@')[0]}`,
                            mentions: [toUnblock],
                            contextInfo: createContext(sender, 'SILVA MD • PRIVACY')
                        }, { quoted: message })
                    } catch (error) {
                        throw new Error(`Failed to unblock: ${error.message}`)
                    }
                    break

                // ========================================
                // GET BLOCKLIST
                // ========================================
                case 'blocklist':
                    try {
                        const blockedList = await sock.fetchBlocklist()
                        
                        if (blockedList.length === 0) {
                            await sock.sendMessage(jid, {
                                text: '📋 No blocked users',
                                contextInfo: createContext(sender, 'SILVA MD • PRIVACY')
                            }, { quoted: message })
                        } else {
                            let blockText = `┏━━━━━━━━━━━━━━━━━━━━┓
┃   ʙʟᴏᴄᴋᴇᴅ ᴜsᴇʀs    ┃
┗━━━━━━━━━━━━━━━━━━━━┛

Total: ${blockedList.length}\n\n`

                            blockedList.slice(0, 50).forEach((jid, i) => {
                                blockText += `${i + 1}. @${jid.split('@')[0]}\n`
                            })
                            
                            if (blockedList.length > 50) {
                                blockText += `\n... and ${blockedList.length - 50} more`
                            }
                            
                            await sock.sendMessage(jid, {
                                text: blockText,
                                mentions: blockedList,
                                contextInfo: createContext(sender, 'SILVA MD • PRIVACY')
                            }, { quoted: message })
                        }
                    } catch (error) {
                        throw new Error(`Failed to get blocklist: ${error.message}`)
                    }
                    break

                // ========================================
                // GET ALL PRIVACY SETTINGS
                // ========================================
                case 'privacy':
                    try {
                        const settings = await sock.fetchPrivacySettings(true)
                        
                        let privacyText = `┏━━━━━━━━━━━━━━━━━━━━┓
┃   ᴘʀɪᴠᴀᴄʏ sᴇᴛᴛɪɴɢs ┃
┗━━━━━━━━━━━━━━━━━━━━┛

👁️ Last Seen: ${settings.readreceipts || 'N/A'}
🟢 Online: ${settings.online || 'N/A'}
📸 Profile Pic: ${settings.profile || 'N/A'}
📱 Status: ${settings.status || 'N/A'}
✅ Read Receipts: ${settings.readreceipts || 'N/A'}
👥 Groups: ${settings.groupadd || 'N/A'}
💬 Disappearing: ${settings.disappearing || 'N/A'}

💡 Use specific commands to change:
• ${config.PREFIX}privacylastseen <value>
• ${config.PREFIX}privacyonline <value>
• ${config.PREFIX}privacypp <value>
• ${config.PREFIX}privacystatus <value>
• ${config.PREFIX}privacyread <value>
• ${config.PREFIX}privacygroup <value>`

                        await sock.sendMessage(jid, {
                            text: privacyText,
                            contextInfo: createContext(sender, 'SILVA MD • PRIVACY')
                        }, { quoted: message })
                    } catch (error) {
                        throw new Error(`Failed to get settings: ${error.message}`)
                    }
                    break

                // ========================================
                // UPDATE LAST SEEN PRIVACY
                // ========================================
                case 'privacylastseen':
                    const lastSeenValue = args[0]?.toLowerCase()
                    
                    if (!lastSeenValue || !['all', 'contacts', 'contact_blacklist', 'none'].includes(lastSeenValue)) {
                        return sock.sendMessage(jid, {
                            text: `┏━━━━━━━━━━━━━━━━━━━━┓
┃   ʟᴀsᴛ sᴇᴇɴ         ┃
┗━━━━━━━━━━━━━━━━━━━━┛

ᴜsᴀɢᴇ:
${config.PREFIX}privacylastseen <value>

ᴏᴘᴛɪᴏɴs:
• all - Everyone
• contacts - My contacts
• contact_blacklist - Contacts except...
• none - Nobody`,
                            contextInfo: createContext(sender, 'SILVA MD • PRIVACY')
                        }, { quoted: message })
                    }

                    try {
                        await sock.updateLastSeenPrivacy(lastSeenValue)
                        await sock.sendMessage(jid, {
                            text: `✅ Last seen privacy set to: ${lastSeenValue}`,
                            contextInfo: createContext(sender, 'SILVA MD • PRIVACY')
                        }, { quoted: message })
                    } catch (error) {
                        throw new Error(`Failed to update: ${error.message}`)
                    }
                    break

                // ========================================
                // UPDATE ONLINE PRIVACY
                // ========================================
                case 'privacyonline':
                    const onlineValue = args[0]?.toLowerCase()
                    
                    if (!onlineValue || !['all', 'match_last_seen'].includes(onlineValue)) {
                        return sock.sendMessage(jid, {
                            text: `┏━━━━━━━━━━━━━━━━━━━━┓
┃   ᴏɴʟɪɴᴇ sᴛᴀᴛᴜs    ┃
┗━━━━━━━━━━━━━━━━━━━━┛

ᴜsᴀɢᴇ:
${config.PREFIX}privacyonline <value>

ᴏᴘᴛɪᴏɴs:
• all - Everyone
• match_last_seen - Same as last seen`,
                            contextInfo: createContext(sender, 'SILVA MD • PRIVACY')
                        }, { quoted: message })
                    }

                    try {
                        await sock.updateOnlinePrivacy(onlineValue)
                        await sock.sendMessage(jid, {
                            text: `✅ Online privacy set to: ${onlineValue}`,
                            contextInfo: createContext(sender, 'SILVA MD • PRIVACY')
                        }, { quoted: message })
                    } catch (error) {
                        throw new Error(`Failed to update: ${error.message}`)
                    }
                    break

                // ========================================
                // UPDATE PROFILE PICTURE PRIVACY
                // ========================================
                case 'privacypp':
                    const ppValue = args[0]?.toLowerCase()
                    
                    if (!ppValue || !['all', 'contacts', 'contact_blacklist', 'none'].includes(ppValue)) {
                        return sock.sendMessage(jid, {
                            text: `┏━━━━━━━━━━━━━━━━━━━━┓
┃   ᴘʀᴏғɪʟᴇ ᴘɪᴄᴛᴜʀᴇ  ┃
┗━━━━━━━━━━━━━━━━━━━━┛

ᴜsᴀɢᴇ:
${config.PREFIX}privacypp <value>

ᴏᴘᴛɪᴏɴs:
• all - Everyone
• contacts - My contacts
• contact_blacklist - Contacts except...
• none - Nobody`,
                            contextInfo: createContext(sender, 'SILVA MD • PRIVACY')
                        }, { quoted: message })
                    }

                    try {
                        await sock.updateProfilePicturePrivacy(ppValue)
                        await sock.sendMessage(jid, {
                            text: `✅ Profile picture privacy set to: ${ppValue}`,
                            contextInfo: createContext(sender, 'SILVA MD • PRIVACY')
                        }, { quoted: message })
                    } catch (error) {
                        throw new Error(`Failed to update: ${error.message}`)
                    }
                    break

                // ========================================
                // UPDATE STATUS PRIVACY
                // ========================================
                case 'privacystatus':
                    const statusValue = args[0]?.toLowerCase()
                    
                    if (!statusValue || !['all', 'contacts', 'contact_blacklist', 'none'].includes(statusValue)) {
                        return sock.sendMessage(jid, {
                            text: `┏━━━━━━━━━━━━━━━━━━━━┓
┃   sᴛᴀᴛᴜs ᴘʀɪᴠᴀᴄʏ   ┃
┗━━━━━━━━━━━━━━━━━━━━┛

ᴜsᴀɢᴇ:
${config.PREFIX}privacystatus <value>

ᴏᴘᴛɪᴏɴs:
• all - Everyone
• contacts - My contacts
• contact_blacklist - Contacts except...
• none - Nobody`,
                            contextInfo: createContext(sender, 'SILVA MD • PRIVACY')
                        }, { quoted: message })
                    }

                    try {
                        await sock.updateStatusPrivacy(statusValue)
                        await sock.sendMessage(jid, {
                            text: `✅ Status privacy set to: ${statusValue}`,
                            contextInfo: createContext(sender, 'SILVA MD • PRIVACY')
                        }, { quoted: message })
                    } catch (error) {
                        throw new Error(`Failed to update: ${error.message}`)
                    }
                    break

                // ========================================
                // UPDATE READ RECEIPTS PRIVACY
                // ========================================
                case 'privacyread':
                    const readValue = args[0]?.toLowerCase()
                    
                    if (!readValue || !['all', 'none'].includes(readValue)) {
                        return sock.sendMessage(jid, {
                            text: `┏━━━━━━━━━━━━━━━━━━━━┓
┃   ʀᴇᴀᴅ ʀᴇᴄᴇɪᴘᴛs    ┃
┗━━━━━━━━━━━━━━━━━━━━┛

ᴜsᴀɢᴇ:
${config.PREFIX}privacyread <value>

ᴏᴘᴛɪᴏɴs:
• all - Send read receipts
• none - Don't send read receipts`,
                            contextInfo: createContext(sender, 'SILVA MD • PRIVACY')
                        }, { quoted: message })
                    }

                    try {
                        await sock.updateReadReceiptsPrivacy(readValue)
                        await sock.sendMessage(jid, {
                            text: `✅ Read receipts set to: ${readValue}`,
                            contextInfo: createContext(sender, 'SILVA MD • PRIVACY')
                        }, { quoted: message })
                    } catch (error) {
                        throw new Error(`Failed to update: ${error.message}`)
                    }
                    break

                // ========================================
                // UPDATE GROUPS ADD PRIVACY
                // ========================================
                case 'privacygroup':
                    const groupValue = args[0]?.toLowerCase()
                    
                    if (!groupValue || !['all', 'contacts', 'contact_blacklist'].includes(groupValue)) {
                        return sock.sendMessage(jid, {
                            text: `┏━━━━━━━━━━━━━━━━━━━━┓
┃   ɢʀᴏᴜᴘ ᴀᴅᴅ        ┃
┗━━━━━━━━━━━━━━━━━━━━┛

ᴜsᴀɢᴇ:
${config.PREFIX}privacygroup <value>

ᴏᴘᴛɪᴏɴs:
• all - Everyone can add me
• contacts - Only my contacts
• contact_blacklist - Contacts except...`,
                            contextInfo: createContext(sender, 'SILVA MD • PRIVACY')
                        }, { quoted: message })
                    }

                    try {
                        await sock.updateGroupsAddPrivacy(groupValue)
                        await sock.sendMessage(jid, {
                            text: `✅ Group add privacy set to: ${groupValue}`,
                            contextInfo: createContext(sender, 'SILVA MD • PRIVACY')
                        }, { quoted: message })
                    } catch (error) {
                        throw new Error(`Failed to update: ${error.message}`)
                    }
                    break

                // ========================================
                // UPDATE DEFAULT DISAPPEARING MODE
                // ========================================
                case 'disappeardefault':
                    const disappearValue = args[0]?.toLowerCase()
                    let ephemeral = 0
                    
                    if (!disappearValue || !['off', '24h', '7d', '90d'].includes(disappearValue)) {
                        return sock.sendMessage(jid, {
                            text: `┏━━━━━━━━━━━━━━━━━━━━┓
┃   ᴅɪsᴀᴘᴘᴇᴀʀ ᴅᴇғᴀᴜʟᴛ┃
┗━━━━━━━━━━━━━━━━━━━━┛

ᴜsᴀɢᴇ:
${config.PREFIX}disappeardefault <time>

ᴏᴘᴛɪᴏɴs:
• off - Disabled
• 24h - 24 hours
• 7d - 7 days
• 90d - 90 days`,
                            contextInfo: createContext(sender, 'SILVA MD • PRIVACY')
                        }, { quoted: message })
                    }

                    if (disappearValue === '24h') ephemeral = 86400
                    else if (disappearValue === '7d') ephemeral = 604800
                    else if (disappearValue === '90d') ephemeral = 7776000

                    try {
                        await sock.updateDefaultDisappearingMode(ephemeral)
                        await sock.sendMessage(jid, {
                            text: `✅ Default disappearing mode set to: ${disappearValue}`,
                            contextInfo: createContext(sender, 'SILVA MD • PRIVACY')
                        }, { quoted: message })
                    } catch (error) {
                        throw new Error(`Failed to update: ${error.message}`)
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

💡 Make sure you have permission to change these settings`,
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

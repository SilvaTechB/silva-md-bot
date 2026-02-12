// Group Management Plugin - Silva MD Bot
const config = require('../config')

const handler = {
    help: ['creategroup', 'add', 'remove', 'promote', 'demote', 'groupname', 'groupdesc', 
           'groupsetting', 'leave', 'grouplink', 'resetlink', 'joingroup', 'groupinfo', 
           'tagall', 'hidetag', 'groupmembers', 'approveall', 'rejectall'],
    tags: ['group', 'admin'],
    command: /^(creategroup|add|remove|promote|demote|groupname|groupdesc|groupsetting|leave|grouplink|resetlink|joingroup|groupinfo|tagall|hidetag|groupmembers|approveall|rejectall)$/i,
    group: true,
    admin: true,
    botAdmin: false,
    owner: false,

    execute: async ({ jid, sock, message, args }) => {
        const sender = message.key.participant || message.key.remoteJid
        const cmd = message.message?.conversation || 
                   message.message?.extendedTextMessage?.text || ''
        const command = cmd.split(' ')[0].replace(config.PREFIX, '').toLowerCase()

        try {
            switch(command) {
                // ========================================
                // CREATE GROUP
                // ========================================
                case 'creategroup':
                    if (args.length < 2) {
                        return sock.sendMessage(jid, {
                            text: `┏━━━━━━━━━━━━━━━━━━━━┓
┃   ᴄʀᴇᴀᴛᴇ ɢʀᴏᴜᴘ     ┃
┗━━━━━━━━━━━━━━━━━━━━┛

ᴜsᴀɢᴇ:
${config.PREFIX}creategroup <name> @user1 @user2

ᴇxᴀᴍᴘʟᴇ:
${config.PREFIX}creategroup My Group @254700000000

💡 Tag at least one user`,
                            contextInfo: createContext(sender, 'SILVA MD • GROUP')
                        }, { quoted: message })
                    }

                    const groupName = args[0]
                    const mentions = message.message?.extendedTextMessage?.contextInfo?.mentionedJid || []
                    
                    if (mentions.length === 0) {
                        return sock.sendMessage(jid, {
                            text: '❌ Please tag at least one user to add',
                            contextInfo: createContext(sender, 'SILVA MD • GROUP')
                        }, { quoted: message })
                    }

                    try {
                        const group = await sock.groupCreate(groupName, mentions)
                        await sock.sendMessage(jid, {
                            text: `✅ Group created successfully!

📛 Name: ${groupName}
🆔 ID: ${group.id}
👥 Members: ${mentions.length + 1}

⚡ Group is ready to use!`,
                            contextInfo: createContext(sender, 'SILVA MD • GROUP')
                        }, { quoted: message })
                        
                        // Send welcome message to group
                        await sock.sendMessage(group.id, {
                            text: `🎉 Welcome to ${groupName}!

Created by: @${sender.split('@')[0]}
Bot: ${config.BOT_NAME}

Type ${config.PREFIX}help for commands`,
                            mentions: [sender]
                        })
                    } catch (error) {
                        throw new Error(`Failed to create group: ${error.message}`)
                    }
                    break

                // ========================================
                // ADD MEMBERS
                // ========================================
                case 'add':
                    if (!jid.endsWith('@g.us')) {
                        return sock.sendMessage(jid, {
                            text: '❌ This command can only be used in groups',
                            contextInfo: createContext(sender, 'SILVA MD • GROUP')
                        }, { quoted: message })
                    }

                    const mentions1 = message.message?.extendedTextMessage?.contextInfo?.mentionedJid || []
                    const numbers = args.filter(arg => /^\d+$/.test(arg.replace(/[^0-9]/g, '')))
                    
                    const toAdd = [...mentions1, ...numbers.map(n => n.replace(/[^0-9]/g, '') + '@s.whatsapp.net')]
                    
                    if (toAdd.length === 0) {
                        return sock.sendMessage(jid, {
                            text: `┏━━━━━━━━━━━━━━━━━━━━┓
┃   ᴀᴅᴅ ᴍᴇᴍʙᴇʀs      ┃
┗━━━━━━━━━━━━━━━━━━━━┛

ᴜsᴀɢᴇ:
${config.PREFIX}add @user
${config.PREFIX}add 254700000000

💡 Tag users or provide numbers`,
                            contextInfo: createContext(sender, 'SILVA MD • GROUP')
                        }, { quoted: message })
                    }

                    try {
                        const result = await sock.groupParticipantsUpdate(jid, toAdd, 'add')
                        await sock.sendMessage(jid, {
                            text: `✅ Added ${toAdd.length} member(s) to group`,
                            contextInfo: createContext(sender, 'SILVA MD • GROUP')
                        }, { quoted: message })
                    } catch (error) {
                        throw new Error(`Failed to add members: ${error.message}`)
                    }
                    break

                // ========================================
                // REMOVE MEMBERS
                // ========================================
                case 'remove':
                    if (!jid.endsWith('@g.us')) {
                        return sock.sendMessage(jid, {
                            text: '❌ This command can only be used in groups',
                            contextInfo: createContext(sender, 'SILVA MD • GROUP')
                        }, { quoted: message })
                    }

                    const mentions2 = message.message?.extendedTextMessage?.contextInfo?.mentionedJid || []
                    
                    if (mentions2.length === 0) {
                        return sock.sendMessage(jid, {
                            text: `❌ Please tag users to remove`,
                            contextInfo: createContext(sender, 'SILVA MD • GROUP')
                        }, { quoted: message })
                    }

                    try {
                        await sock.groupParticipantsUpdate(jid, mentions2, 'remove')
                        await sock.sendMessage(jid, {
                            text: `✅ Removed ${mentions2.length} member(s) from group`,
                            contextInfo: createContext(sender, 'SILVA MD • GROUP')
                        }, { quoted: message })
                    } catch (error) {
                        throw new Error(`Failed to remove members: ${error.message}`)
                    }
                    break

                // ========================================
                // PROMOTE TO ADMIN
                // ========================================
                case 'promote':
                    if (!jid.endsWith('@g.us')) {
                        return sock.sendMessage(jid, {
                            text: '❌ This command can only be used in groups',
                            contextInfo: createContext(sender, 'SILVA MD • GROUP')
                        }, { quoted: message })
                    }

                    const mentions3 = message.message?.extendedTextMessage?.contextInfo?.mentionedJid || []
                    
                    if (mentions3.length === 0) {
                        return sock.sendMessage(jid, {
                            text: `❌ Please tag users to promote`,
                            contextInfo: createContext(sender, 'SILVA MD • GROUP')
                        }, { quoted: message })
                    }

                    try {
                        await sock.groupParticipantsUpdate(jid, mentions3, 'promote')
                        await sock.sendMessage(jid, {
                            text: `👑 Promoted ${mentions3.length} member(s) to admin`,
                            mentions: mentions3,
                            contextInfo: createContext(sender, 'SILVA MD • GROUP')
                        }, { quoted: message })
                    } catch (error) {
                        throw new Error(`Failed to promote: ${error.message}`)
                    }
                    break

                // ========================================
                // DEMOTE FROM ADMIN
                // ========================================
                case 'demote':
                    if (!jid.endsWith('@g.us')) {
                        return sock.sendMessage(jid, {
                            text: '❌ This command can only be used in groups',
                            contextInfo: createContext(sender, 'SILVA MD • GROUP')
                        }, { quoted: message })
                    }

                    const mentions4 = message.message?.extendedTextMessage?.contextInfo?.mentionedJid || []
                    
                    if (mentions4.length === 0) {
                        return sock.sendMessage(jid, {
                            text: `❌ Please tag admins to demote`,
                            contextInfo: createContext(sender, 'SILVA MD • GROUP')
                        }, { quoted: message })
                    }

                    try {
                        await sock.groupParticipantsUpdate(jid, mentions4, 'demote')
                        await sock.sendMessage(jid, {
                            text: `📉 Demoted ${mentions4.length} admin(s) to member`,
                            mentions: mentions4,
                            contextInfo: createContext(sender, 'SILVA MD • GROUP')
                        }, { quoted: message })
                    } catch (error) {
                        throw new Error(`Failed to demote: ${error.message}`)
                    }
                    break

                // ========================================
                // CHANGE GROUP NAME
                // ========================================
                case 'groupname':
                    if (!jid.endsWith('@g.us')) {
                        return sock.sendMessage(jid, {
                            text: '❌ This command can only be used in groups',
                            contextInfo: createContext(sender, 'SILVA MD • GROUP')
                        }, { quoted: message })
                    }

                    if (!args[0]) {
                        return sock.sendMessage(jid, {
                            text: `${config.PREFIX}groupname <new name>`,
                            contextInfo: createContext(sender, 'SILVA MD • GROUP')
                        }, { quoted: message })
                    }

                    const newName = args.join(' ')
                    try {
                        await sock.groupUpdateSubject(jid, newName)
                        await sock.sendMessage(jid, {
                            text: `✅ Group name changed to: ${newName}`,
                            contextInfo: createContext(sender, 'SILVA MD • GROUP')
                        }, { quoted: message })
                    } catch (error) {
                        throw new Error(`Failed to change name: ${error.message}`)
                    }
                    break

                // ========================================
                // CHANGE GROUP DESCRIPTION
                // ========================================
                case 'groupdesc':
                    if (!jid.endsWith('@g.us')) {
                        return sock.sendMessage(jid, {
                            text: '❌ This command can only be used in groups',
                            contextInfo: createContext(sender, 'SILVA MD • GROUP')
                        }, { quoted: message })
                    }

                    if (!args[0]) {
                        return sock.sendMessage(jid, {
                            text: `${config.PREFIX}groupdesc <new description>`,
                            contextInfo: createContext(sender, 'SILVA MD • GROUP')
                        }, { quoted: message })
                    }

                    const newDesc = args.join(' ')
                    try {
                        await sock.groupUpdateDescription(jid, newDesc)
                        await sock.sendMessage(jid, {
                            text: `✅ Group description updated!`,
                            contextInfo: createContext(sender, 'SILVA MD • GROUP')
                        }, { quoted: message })
                    } catch (error) {
                        throw new Error(`Failed to update description: ${error.message}`)
                    }
                    break

                // ========================================
                // GROUP SETTINGS
                // ========================================
                case 'groupsetting':
                    if (!jid.endsWith('@g.us')) {
                        return sock.sendMessage(jid, {
                            text: '❌ This command can only be used in groups',
                            contextInfo: createContext(sender, 'SILVA MD • GROUP')
                        }, { quoted: message })
                    }

                    const setting = args[0]?.toLowerCase()
                    
                    if (!setting || !['open', 'close', 'lock', 'unlock'].includes(setting)) {
                        return sock.sendMessage(jid, {
                            text: `┏━━━━━━━━━━━━━━━━━━━━┓
┃   ɢʀᴏᴜᴘ sᴇᴛᴛɪɴɢs   ┃
┗━━━━━━━━━━━━━━━━━━━━┛

ᴜsᴀɢᴇ:
${config.PREFIX}groupsetting <option>

ᴏᴘᴛɪᴏɴs:
• open - Everyone can send messages
• close - Only admins can send
• lock - Only admins can edit info
• unlock - Everyone can edit info`,
                            contextInfo: createContext(sender, 'SILVA MD • GROUP')
                        }, { quoted: message })
                    }

                    try {
                        if (setting === 'open') {
                            await sock.groupSettingUpdate(jid, 'not_announcement')
                            await sock.sendMessage(jid, {
                                text: '🔓 Group opened - Everyone can send messages',
                                contextInfo: createContext(sender, 'SILVA MD • GROUP')
                            }, { quoted: message })
                        } else if (setting === 'close') {
                            await sock.groupSettingUpdate(jid, 'announcement')
                            await sock.sendMessage(jid, {
                                text: '🔒 Group closed - Only admins can send',
                                contextInfo: createContext(sender, 'SILVA MD • GROUP')
                            }, { quoted: message })
                        } else if (setting === 'unlock') {
                            await sock.groupSettingUpdate(jid, 'unlocked')
                            await sock.sendMessage(jid, {
                                text: '🔓 Group unlocked - Everyone can edit info',
                                contextInfo: createContext(sender, 'SILVA MD • GROUP')
                            }, { quoted: message })
                        } else if (setting === 'lock') {
                            await sock.groupSettingUpdate(jid, 'locked')
                            await sock.sendMessage(jid, {
                                text: '🔒 Group locked - Only admins can edit',
                                contextInfo: createContext(sender, 'SILVA MD • GROUP')
                            }, { quoted: message })
                        }
                    } catch (error) {
                        throw new Error(`Failed to update settings: ${error.message}`)
                    }
                    break

                // ========================================
                // LEAVE GROUP
                // ========================================
                case 'leave':
                    if (!jid.endsWith('@g.us')) {
                        return sock.sendMessage(jid, {
                            text: '❌ This command can only be used in groups',
                            contextInfo: createContext(sender, 'SILVA MD • GROUP')
                        }, { quoted: message })
                    }

                    try {
                        await sock.sendMessage(jid, {
                            text: '👋 Goodbye! Thanks for using Silva MD',
                            contextInfo: createContext(sender, 'SILVA MD • GROUP')
                        })
                        await sock.groupLeave(jid)
                    } catch (error) {
                        throw new Error(`Failed to leave group: ${error.message}`)
                    }
                    break

                // ========================================
                // GET GROUP INVITE LINK
                // ========================================
                case 'grouplink':
                    if (!jid.endsWith('@g.us')) {
                        return sock.sendMessage(jid, {
                            text: '❌ This command can only be used in groups',
                            contextInfo: createContext(sender, 'SILVA MD • GROUP')
                        }, { quoted: message })
                    }

                    try {
                        const code = await sock.groupInviteCode(jid)
                        await sock.sendMessage(jid, {
                            text: `┏━━━━━━━━━━━━━━━━━━━━┓
┃   ɢʀᴏᴜᴘ ʟɪɴᴋ       ┃
┗━━━━━━━━━━━━━━━━━━━━┛

🔗 https://chat.whatsapp.com/${code}

💡 Share this link to invite people`,
                            contextInfo: createContext(sender, 'SILVA MD • GROUP')
                        }, { quoted: message })
                    } catch (error) {
                        throw new Error(`Failed to get link: ${error.message}`)
                    }
                    break

                // ========================================
                // RESET/REVOKE INVITE LINK
                // ========================================
                case 'resetlink':
                    if (!jid.endsWith('@g.us')) {
                        return sock.sendMessage(jid, {
                            text: '❌ This command can only be used in groups',
                            contextInfo: createContext(sender, 'SILVA MD • GROUP')
                        }, { quoted: message })
                    }

                    try {
                        const code = await sock.groupRevokeInvite(jid)
                        await sock.sendMessage(jid, {
                            text: `✅ Invite link reset!

🔗 New link: https://chat.whatsapp.com/${code}`,
                            contextInfo: createContext(sender, 'SILVA MD • GROUP')
                        }, { quoted: message })
                    } catch (error) {
                        throw new Error(`Failed to reset link: ${error.message}`)
                    }
                    break

                // ========================================
                // JOIN GROUP VIA LINK
                // ========================================
                case 'joingroup':
                    if (!args[0]) {
                        return sock.sendMessage(jid, {
                            text: `${config.PREFIX}joingroup <link or code>`,
                            contextInfo: createContext(sender, 'SILVA MD • GROUP')
                        }, { quoted: message })
                    }

                    const inviteCode = args[0].replace('https://chat.whatsapp.com/', '')
                    
                    try {
                        const response = await sock.groupAcceptInvite(inviteCode)
                        await sock.sendMessage(jid, {
                            text: `✅ Successfully joined group!

🆔 Group ID: ${response}`,
                            contextInfo: createContext(sender, 'SILVA MD • GROUP')
                        }, { quoted: message })
                    } catch (error) {
                        throw new Error(`Failed to join: ${error.message}`)
                    }
                    break

                // ========================================
                // GET GROUP INFO
                // ========================================
                case 'groupinfo':
                    if (!jid.endsWith('@g.us')) {
                        return sock.sendMessage(jid, {
                            text: '❌ This command can only be used in groups',
                            contextInfo: createContext(sender, 'SILVA MD • GROUP')
                        }, { quoted: message })
                    }

                    try {
                        const metadata = await sock.groupMetadata(jid)
                        const admins = metadata.participants.filter(p => p.admin).length
                        const members = metadata.participants.length
                        
                        let infoText = `┏━━━━━━━━━━━━━━━━━━━━┓
┃   ɢʀᴏᴜᴘ ɪɴғᴏ       ┃
┗━━━━━━━━━━━━━━━━━━━━┛

📛 Name: ${metadata.subject}
🆔 ID: ${metadata.id}
👥 Members: ${members}
👑 Admins: ${admins}
📅 Created: ${new Date(metadata.creation * 1000).toLocaleDateString()}
🔒 Restricted: ${metadata.restrict ? 'Yes' : 'No'}
🔔 Announce: ${metadata.announce ? 'Yes' : 'No'}

${metadata.desc ? `📝 Description:\n${metadata.desc}` : ''}

⚡ Silva MD`

                        await sock.sendMessage(jid, {
                            text: infoText,
                            contextInfo: createContext(sender, 'SILVA MD • GROUP')
                        }, { quoted: message })
                    } catch (error) {
                        throw new Error(`Failed to get info: ${error.message}`)
                    }
                    break

                // ========================================
                // TAG ALL (mention all)
                // ========================================
                case 'tagall':
                    if (!jid.endsWith('@g.us')) {
                        return sock.sendMessage(jid, {
                            text: '❌ This command can only be used in groups',
                            contextInfo: createContext(sender, 'SILVA MD • GROUP')
                        }, { quoted: message })
                    }

                    try {
                        const metadata = await sock.groupMetadata(jid)
                        const participants = metadata.participants.map(p => p.id)
                        const text = args.join(' ') || '📢 Attention everyone!'
                        
                        let tagText = `${text}\n\n`
                        participants.forEach((jid, i) => {
                            tagText += `${i + 1}. @${jid.split('@')[0]}\n`
                        })
                        
                        await sock.sendMessage(jid, {
                            text: tagText,
                            mentions: participants
                        }, { quoted: message })
                    } catch (error) {
                        throw new Error(`Failed to tag all: ${error.message}`)
                    }
                    break

                // ========================================
                // HIDETAG (mention without showing numbers)
                // ========================================
                case 'hidetag':
                    if (!jid.endsWith('@g.us')) {
                        return sock.sendMessage(jid, {
                            text: '❌ This command can only be used in groups',
                            contextInfo: createContext(sender, 'SILVA MD • GROUP')
                        }, { quoted: message })
                    }

                    try {
                        const metadata = await sock.groupMetadata(jid)
                        const participants = metadata.participants.map(p => p.id)
                        const text = args.join(' ') || '📢 Hidden mention to all!'
                        
                        await sock.sendMessage(jid, {
                            text: text,
                            mentions: participants
                        }, { quoted: message })
                    } catch (error) {
                        throw new Error(`Failed to hidetag: ${error.message}`)
                    }
                    break

                // ========================================
                // LIST GROUP MEMBERS
                // ========================================
                case 'groupmembers':
                    if (!jid.endsWith('@g.us')) {
                        return sock.sendMessage(jid, {
                            text: '❌ This command can only be used in groups',
                            contextInfo: createContext(sender, 'SILVA MD • GROUP')
                        }, { quoted: message })
                    }

                    try {
                        const metadata = await sock.groupMetadata(jid)
                        let memberText = `┏━━━━━━━━━━━━━━━━━━━━┓
┃   ɢʀᴏᴜᴘ ᴍᴇᴍʙᴇʀs   ┃
┗━━━━━━━━━━━━━━━━━━━━┛

Total: ${metadata.participants.length}\n\n`

                        const admins = metadata.participants.filter(p => p.admin)
                        const members = metadata.participants.filter(p => !p.admin)
                        
                        memberText += `👑 Admins (${admins.length}):\n`
                        admins.forEach((p, i) => {
                            memberText += `${i + 1}. @${p.id.split('@')[0]}\n`
                        })
                        
                        memberText += `\n👥 Members (${members.length}):\n`
                        members.slice(0, 20).forEach((p, i) => {
                            memberText += `${i + 1}. @${p.id.split('@')[0]}\n`
                        })
                        
                        if (members.length > 20) {
                            memberText += `\n... and ${members.length - 20} more`
                        }
                        
                        await sock.sendMessage(jid, {
                            text: memberText,
                            mentions: metadata.participants.map(p => p.id)
                        }, { quoted: message })
                    } catch (error) {
                        throw new Error(`Failed to list members: ${error.message}`)
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

💡 Make sure bot has admin rights and you have permission`,
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

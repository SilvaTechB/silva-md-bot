// lib/events.js - Auto Event Loader for Silva MD Bot
// This file automatically registers event handlers without touching silva.js

const { handleGroupUpdate: antiDemoteHandler } = require('../silvaxlab/antidemote')
const config = require('../config')

/**
 * Register all event handlers
 * Call this once from your main bot initialization
 */
function registerEvents(sock) {
    console.log('[EVENTS] Registering event handlers...')

    // ========================================
    // GROUP PARTICIPANTS UPDATE
    // ========================================
    sock.ev.on('group-participants.update', async (update) => {
        try {
            const { id: groupJid, participants, action, author } = update
            
            console.log(`[EVENT] Group update: ${action} in ${groupJid}`)

            // ========================================
            // 1. ANTI-DEMOTE PROTECTION
            // ========================================
            await antiDemoteHandler(update, sock)

            // ========================================
            // 2. BOT ADDED TO GROUP
            // ========================================
            if (action === 'add') {
                const botJid = sock.user?.id?.split(':')[0] + '@s.whatsapp.net'
                
                if (participants.includes(botJid)) {
                    await sock.sendMessage(groupJid, {
                        text: `🎉 *${config.BOT_NAME} Activated!*

Thank you for adding me to this group!

📋 Quick Start:
• ${config.PREFIX}menu - Show all commands
• ${config.PREFIX}antidemote on - Enable admin protection
• ${config.PREFIX}help - Get help

⚡ Powered by Silva MD`,
                        contextInfo: {
                            forwardingScore: 999,
                            isForwarded: true,
                            forwardedNewsletterMessageInfo: {
                                newsletterJid: '120363200367779016@newsletter',
                                newsletterName: 'SILVA MD • WELCOME',
                                serverMessageId: Math.floor(Math.random() * 1000)
                            }
                        }
                    })
                    
                    console.log(`[EVENT] Bot added to group: ${groupJid}`)
                } else {
                    // Other users were added (Welcome message)
                    if (config.WELCOME_MSG !== false) {
                        try {
                            const metadata = await sock.groupMetadata(groupJid)
                            
                            let welcomeText = `👋 *Welcome to ${metadata.subject}!*\n\n`
                            participants.forEach(jid => {
                                welcomeText += `• @${jid.split('@')[0]}\n`
                            })
                            welcomeText += `\nEnjoy your stay! 🎉`
                            
                            await sock.sendMessage(groupJid, {
                                text: welcomeText,
                                mentions: participants
                            })
                        } catch (e) {
                            console.error('[EVENT] Welcome message error:', e.message)
                        }
                    }
                }
            }

            // ========================================
            // 3. MEMBER REMOVED/LEFT
            // ========================================
            if (action === 'remove') {
                if (config.GOODBYE_MSG !== false) {
                    try {
                        let goodbyeText = `👋 *Goodbye!*\n\n`
                        participants.forEach(jid => {
                            goodbyeText += `• @${jid.split('@')[0]}\n`
                        })
                        goodbyeText += `\nWe'll miss you! 💔`
                        
                        await sock.sendMessage(groupJid, {
                            text: goodbyeText,
                            mentions: participants
                        })
                    } catch (e) {
                        console.error('[EVENT] Goodbye message error:', e.message)
                    }
                }
            }

            // ========================================
            // 4. PROMOTION/DEMOTION ANNOUNCEMENTS
            // ========================================
            if ((action === 'promote' || action === 'demote') && config.PROMOTE_DEMOTE_MSG !== false) {
                try {
                    const actionText = action === 'promote' ? 'promoted to admin 👑' : 'demoted from admin 📉'
                    const emoji = action === 'promote' ? '👑' : '📉'
                    
                    let announceText = `${emoji} *Group Update*\n\n`
                    participants.forEach(jid => {
                        announceText += `@${jid.split('@')[0]} was ${actionText}\n`
                    })
                    
                    if (author) {
                        announceText += `\nBy: @${author.split('@')[0]}`
                    }
                    
                    await sock.sendMessage(groupJid, {
                        text: announceText,
                        mentions: [...participants, ...(author ? [author] : [])]
                    })
                } catch (e) {
                    console.error('[EVENT] Promotion/Demotion message error:', e.message)
                }
            }

        } catch (error) {
            console.error('[EVENT] Group participants update error:', error.message)
        }
    })

    console.log('[EVENTS] ✅ Event handlers registered successfully')
}

module.exports = { registerEvents }
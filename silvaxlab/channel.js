// Channel JID Resolver - Silva MD Bot
const config = require('../config')

const handler = {
    help: ['channeljid', 'newsletterjid', 'getchannelid'],
    tags: ['tools'],
    command: /^(channeljid|newsletterjid|getchannelid)$/i,
    group: false,
    admin: false,
    botAdmin: false,
    owner: false,

    execute: async ({ jid, sock, message, args }) => {
        const sender = message.key.participant || message.key.remoteJid

        try {
            let channelJid = null
            let channelMeta = null
            let method = 'unknown'

            // ═══════════════════════════════════════
            // METHOD 1: Argument Provided
            // ═══════════════════════════════════════
            if (args[0]) {
                const input = args[0].trim()

                // Case A: Already a newsletter JID
                if (input.endsWith('@newsletter')) {
                    channelJid = input
                    method = 'Direct JID'

                    // Try to fetch metadata
                    try {
                        channelMeta = await sock.newsletterMetadata('jid', channelJid)
                    } catch (e) {
                        console.log('Could not fetch metadata for provided JID')
                    }
                }
                // Case B: WhatsApp channel link
                else if (input.includes('whatsapp.com/channel/')) {
                    const inviteCode = input.split('/channel/')[1]?.split('/')[0]?.split('?')[0]?.trim()

                    if (!inviteCode) {
                        throw new Error('Invalid channel link format')
                    }

                    method = 'Invite Code'

                    // Resolve using invite code
                    try {
                        channelMeta = await sock.newsletterMetadata('invite', inviteCode)
                        channelJid = channelMeta?.id
                    } catch (e) {
                        throw new Error(`Could not resolve channel: ${e.message}`)
                    }
                }
                // Case C: Raw invite code
                else if (input.length > 10 && !input.includes('/')) {
                    method = 'Raw Invite Code'

                    try {
                        channelMeta = await sock.newsletterMetadata('invite', input)
                        channelJid = channelMeta?.id
                    } catch (e) {
                        throw new Error(`Invalid invite code: ${e.message}`)
                    }
                }
                else {
                    throw new Error('Invalid input format')
                }
            }
            // ═══════════════════════════════════════
            // METHOD 2: Current Chat (if it's a channel)
            // ═══════════════════════════════════════
            else {
                const currentJid = message.key.remoteJid

                if (currentJid.endsWith('@newsletter')) {
                    channelJid = currentJid
                    method = 'Current Chat'

                    try {
                        channelMeta = await sock.newsletterMetadata('jid', channelJid)
                    } catch (e) {
                        console.log('Could not fetch metadata for current channel')
                    }
                } else {
                    return sock.sendMessage(jid, {
                        text: `┏━━━━━━━━━━━━━━━━━━━━┓
┃  ᴄʜᴀɴɴᴇʟ ᴊɪᴅ ᴛᴏᴏʟ  ┃
┗━━━━━━━━━━━━━━━━━━━━┛

❌ This is not a channel

ᴜsᴀɢᴇ:
${config.PREFIX}channeljid <link/code>

ᴇxᴀᴍᴘʟᴇs:
${config.PREFIX}channeljid https://whatsapp.com/channel/xyz
${config.PREFIX}channeljid ABC123XYZ
${config.PREFIX}channeljid 120363...@newsletter

💡 Or use in a channel to get its JID`,
                        contextInfo: createContext(sender, 'SILVA MD • CHANNELS')
                    }, { quoted: message })
                }
            }

            // ═══════════════════════════════════════
            // VALIDATION
            // ═══════════════════════════════════════
            if (!channelJid || !channelJid.endsWith('@newsletter')) {
                throw new Error('Failed to resolve channel JID')
            }

            // ═══════════════════════════════════════
            // FORMAT RESPONSE
            // ═══════════════════════════════════════
            const response = `┏━━━━━━━━━━━━━━━━━━━━┓
┃  ᴄʜᴀɴɴᴇʟ ʀᴇsᴏʟᴠᴇᴅ  ┃
┗━━━━━━━━━━━━━━━━━━━━┛

┏─『 ᴊɪᴅ ɪɴғᴏ 』──⊷
│ ${channelJid}
┗──────────────⊷

┏─『 ᴍᴇᴛʜᴏᴅ 』──⊷
│ ${method}
┗──────────────⊷
${channelMeta ? `
┏─『 ᴄʜᴀɴɴᴇʟ ᴅᴇᴛᴀɪʟs 』──⊷
│ ɴᴀᴍᴇ: ${channelMeta.name || 'N/A🙃'}
│ sᴜʙsᴄʀɪʙᴇʀs: ${channelMeta.subscribers || 'N/A🎈'}
│ ᴅᴇsᴄʀɪᴘᴛɪᴏɴ: ${channelMeta.description?.substring(0, 50) || 'N/A❤️‍🩹'}${channelMeta.description?.length > 50 ? '...' : ''}
│ ᴠᴇʀɪғɪᴇᴅ: ${channelMeta.verified ? '✅' : '💎'}
┗──────────────⊷
` : ''}
━━━━━━━━━━━━━━━━━━━━
⚡ sɪʟᴠᴀ ᴍᴅ ᴄʜᴀɴɴᴇʟ ᴛᴏᴏʟs`

            await sock.sendMessage(jid, {
                text: response,
                contextInfo: createContext(sender, 'SILVA MD • CHANNELS')
            }, { quoted: message })

        } catch (err) {
            console.error('ChannelJID Error:', err)

            await sock.sendMessage(jid, {
                text: `┏━━━━━━━━━━━━━━━━━━━━┓
┃  ʀᴇsᴏʟᴠᴇ ғᴀɪʟᴇᴅ    ┃
┗━━━━━━━━━━━━━━━━━━━━┛

❌ ${err.message}

┏─『 ᴄʜᴇᴄᴋʟɪsᴛ 』──⊷
│ ✓ Channel exists and is public
│ ✓ Link/code is valid
│ ✓ Bot has internet access
│ ✓ You're subscribed to the channel
┗──────────────⊷

ᴜsᴀɢᴇ:
${config.PREFIX}channeljid <link>
${config.PREFIX}channeljid <invite-code>

⚠️ Try using the command inside the channel`,
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
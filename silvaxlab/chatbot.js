const config = require('../config')
const axios = require('axios')

const chatbotGroups = new Map()

const handler = {
    help: ['chatbot'],
    tags: ['group', 'admin'],
    command: /^(chatbot)$/i,
    group: true,
    admin: true,
    botAdmin: false,
    owner: false,

    execute: async ({ jid, sock, message, args }) => {
        const sender = message.key.participant || message.key.remoteJid

        try {
            const action = args[0]?.toLowerCase()

            if (!action || !['on', 'off'].includes(action)) {
                const isOn = chatbotGroups.has(jid)
                return sock.sendMessage(jid, {
                    text: `╭━━━━━━━━━━━━━━━━━━━━╮\n┃   🤖 CHATBOT         ┃\n╰━━━━━━━━━━━━━━━━━━━━╯\n\n📊 *Status:* ${isOn ? '✅ ENABLED' : '❌ DISABLED'}\n\n*Usage:*\n${config.PREFIX}chatbot on - Enable auto-reply chatbot\n${config.PREFIX}chatbot off - Disable chatbot\n\n_When enabled, the bot responds to all non-command messages in this group with AI-powered replies._`,
                    contextInfo: createContext(sender)
                }, { quoted: message })
            }

            if (action === 'on') {
                chatbotGroups.set(jid, true)
                await sock.sendMessage(jid, {
                    text: `✅ *Chatbot Enabled!*\n\nThe bot will now auto-reply to messages in this group.\nUse ${config.PREFIX}chatbot off to disable.`,
                    contextInfo: createContext(sender)
                }, { quoted: message })
            } else {
                chatbotGroups.delete(jid)
                await sock.sendMessage(jid, {
                    text: `❌ *Chatbot Disabled*`,
                    contextInfo: createContext(sender)
                }, { quoted: message })
            }

        } catch (err) {
            await sock.sendMessage(jid, {
                text: `❌ Error: ${err.message}`
            }, { quoted: message })
        }
    }
}

function createContext(sender) {
    return {
        mentionedJid: [sender],
        forwardingScore: 999,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
            newsletterJid: '120363200367779016@newsletter',
            newsletterName: 'SILVA MD • CHATBOT',
            serverMessageId: Math.floor(Math.random() * 1000)
        }
    }
}

module.exports = { handler, chatbotGroups }

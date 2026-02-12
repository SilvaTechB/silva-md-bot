// RunJS Plugin - Advanced JavaScript Executor
const config = require('../config')
const util = require('util')
const vm = require('vm')

const handler = {
    help: ['runjs', 'js'],
    tags: ['tools'],
    command: /^(runjs|js)$/i,
    owner: false,

    execute: async ({ jid, sock, message, args }) => {
        const from = message.key.remoteJid
        const sender = message.key.participant || from
        const code = args.join(' ').trim()

        if (!code) {
            return sock.sendMessage(jid, {
                text: `┏━━━━━━━━━━━━━━━━━━━━┓
┃  ʀᴜɴᴊs ᴄᴏɴsᴏʟᴇ    ┃
┗━━━━━━━━━━━━━━━━━━━━┛

ᴜsᴀɢᴇ:
${config.PREFIX}runjs <code>

ᴇxᴀᴍᴘʟᴇs:
${config.PREFIX}runjs console.log("Hello")
${config.PREFIX}runjs [1,2,3].map(x => x * 2)
${config.PREFIX}runjs Math.random()
${config.PREFIX}runjs new Date().toISOString()
${config.PREFIX}runjs JSON.stringify({a: 1, b: 2})

💡 Supports async/await and returns values`,
                contextInfo: createContext(sender, 'SILVA MD • RUNJS')
            }, { quoted: message })
        }

        let output = []
        let errors = []
        let result = undefined
        let executionTime = 0

        // Enhanced console capture
        const captureConsole = {
            log: (...args) => {
                const formatted = args.map(arg => 
                    typeof arg === 'object' ? util.inspect(arg, { depth: 2, colors: false }) : String(arg)
                ).join(' ')
                output.push(formatted)
            },
            error: (...args) => {
                const formatted = args.map(arg => String(arg)).join(' ')
                errors.push(`❌ ${formatted}`)
            },
            warn: (...args) => {
                const formatted = args.map(arg => String(arg)).join(' ')
                errors.push(`⚠️ ${formatted}`)
            },
            info: (...args) => {
                const formatted = args.map(arg => String(arg)).join(' ')
                output.push(`ℹ️ ${formatted}`)
            },
            debug: (...args) => {
                const formatted = args.map(arg => String(arg)).join(' ')
                output.push(`🐛 ${formatted}`)
            }
        }

        try {
            // Show processing reaction
            await sock.sendMessage(jid, {
                react: { text: '⚡', key: message.key }
            })

            const startTime = Date.now()

            // Create sandbox context with useful utilities
            const sandbox = {
                console: captureConsole,
                Math,
                Date,
                JSON,
                Array,
                Object,
                String,
                Number,
                Boolean,
                parseInt,
                parseFloat,
                isNaN,
                isFinite,
                Buffer,
                setTimeout,
                setInterval,
                clearTimeout,
                clearInterval,
                Promise,
                // Add utility functions
                util,
                inspect: (obj) => util.inspect(obj, { depth: 3, colors: false })
            }

            // Execute code with async support
            const wrappedCode = `
                (async () => {
                    ${code.includes('return') ? code : `return ${code}`}
                })()
            `

            const script = new vm.Script(wrappedCode)
            const context = vm.createContext(sandbox)
            
            result = await script.runInContext(context, {
                timeout: 5000, // 5 second timeout
                displayErrors: true
            })

            executionTime = Date.now() - startTime

            // Show success reaction
            await sock.sendMessage(jid, {
                react: { text: '✅', key: message.key }
            })

        } catch (err) {
            executionTime = Date.now() - (Date.now() - executionTime)
            errors.push(`${err.name}: ${err.message}`)
            
            await sock.sendMessage(jid, {
                react: { text: '❌', key: message.key }
            })
        }

        // Format result
        let formattedResult = ''
        if (result !== undefined) {
            if (typeof result === 'object' && result !== null) {
                formattedResult = util.inspect(result, {
                    depth: 3,
                    colors: false,
                    maxArrayLength: 50,
                    breakLength: 80
                })
            } else {
                formattedResult = String(result)
            }
        }

        // Build response
        let response = `┏━━━━━━━━━━━━━━━━━━━━┓
┃  ʀᴜɴᴊs ʀᴇsᴜʟᴛs   ┃
┗━━━━━━━━━━━━━━━━━━━━┛

┏─『 ᴄᴏᴅᴇ 』──⊷
│ ${code}
┗──────────────⊷

┏─『 ᴇxᴇᴄᴜᴛɪᴏɴ 』──⊷
│ ᴛɪᴍᴇ: ${executionTime}ms
│ sᴛᴀᴛᴜs: ${errors.length ? '❌ Failed' : '✅ Success'}
┗──────────────⊷
`

        // Add console output
        if (output.length > 0) {
            response += `
┏─『 ᴄᴏɴsᴏʟᴇ ᴏᴜᴛᴘᴜᴛ 』──⊷
${output.map(o => `│ ${o}`).join('\n')}
┗──────────────⊷
`
        }

        // Add return value
        if (formattedResult) {
            response += `
┏─『 ʀᴇᴛᴜʀɴ ᴠᴀʟᴜᴇ 』──⊷
│ ᴛʏᴘᴇ: ${typeof result}
${formattedResult.split('\n').map(line => `│ ${line}`).join('\n')}
┗──────────────⊷
`
        }

        // Add errors
        if (errors.length > 0) {
            response += `
┏─『 ᴇʀʀᴏʀs 』──⊷
${errors.map(e => `│ ${e}`).join('\n')}
┗──────────────⊷
`
        }

        response += `
━━━━━━━━━━━━━━━━━━━━
⚡ sɪʟᴠᴀ ᴍᴅ ᴊs ʀᴜɴᴛɪᴍᴇ`

        // Truncate if too long
        if (response.length > 4000) {
            response = response.substring(0, 3900) + '\n\n... (truncated)\n━━━━━━━━━━━━━━━━━━━━\n⚡ sɪʟᴠᴀ ᴍᴅ ᴊs ʀᴜɴᴛɪᴍᴇ'
        }

        await sock.sendMessage(jid, {
            text: response,
            contextInfo: createContext(sender, 'SILVA MD • RUNJS')
        }, { quoted: message })
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

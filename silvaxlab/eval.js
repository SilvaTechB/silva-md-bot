const util = require('util')
const config = require('../config')
const { exec } = require('child_process')

const handler = {
    help: ['eval', 'ev', '$'],
    tags: ['owner'],
    command: /^(eval|ev|\$)$/i,
    owner: true,

    execute: async ({ jid, sock, message, args, bot }) => {
        try {
            const from = message.key.remoteJid
            const sender = message.key.participant || from
            const query = args.join(' ').trim()

            if (!query) {
                return sock.sendMessage(jid, {
                    text: `╭━━━━━━━━━━━━━━━━━━━━╮
┃   ⚡ EVAL ENGINE     ┃
╰━━━━━━━━━━━━━━━━━━━━╯

*Usage:*
${config.PREFIX}eval <code>
${config.PREFIX}$ <code>

*Examples:*
${config.PREFIX}eval sock.user
${config.PREFIX}eval message.key
${config.PREFIX}eval await sock.groupMetadata(from)
${config.PREFIX}eval process.memoryUsage()
${config.PREFIX}eval Object.keys(require('../config'))

_Executes JavaScript with full bot context_
_⚠️ Owner only command_`
                }, { quoted: message })
            }

            const m = message
            const conn = sock

            let result
            let executionTime
            const startTime = Date.now()

            try {
                const asyncEval = new Function(
                    'sock', 'conn', 'message', 'm', 'mek', 'from', 'sender', 'jid',
                    'config', 'args', 'util', 'bot', 'console', 'Buffer', 'JSON',
                    'Object', 'Array', 'String', 'Number', 'Math', 'Date',
                    'Promise', 'require', 'process', 'exec',
                    `return (async () => { ${query.includes('return') ? query : `return ${query}`} })()`
                )

                result = await asyncEval(
                    sock, sock, message, message, message, from, sender, jid,
                    config, args, util, bot, console, Buffer, JSON,
                    Object, Array, String, Number, Math, Date,
                    Promise, require, process, exec
                )
                executionTime = Date.now() - startTime

            } catch (evalError) {
                executionTime = Date.now() - startTime
                
                return sock.sendMessage(jid, {
                    text: `╭━━━━━━━━━━━━━━━━━━━━╮
┃   ❌ EVAL ERROR      ┃
╰━━━━━━━━━━━━━━━━━━━━╯

*Error:* ${evalError.name}
*Message:* ${evalError.message}

*Input:*
\`\`\`${query}\`\`\`

⏱️ Failed after ${executionTime}ms`
                }, { quoted: message })
            }

            let formattedResult
            const resultType = typeof result

            if (result === undefined) {
                formattedResult = 'undefined'
            } else if (result === null) {
                formattedResult = 'null'
            } else if (resultType === 'function') {
                formattedResult = `[Function: ${result.name || 'anonymous'}]`
            } else if (resultType === 'object') {
                formattedResult = util.inspect(result, {
                    depth: 3,
                    colors: false,
                    maxArrayLength: 50,
                    breakLength: 80,
                    compact: false,
                    sorted: false,
                    getters: true
                })
            } else {
                formattedResult = String(result)
            }

            const maxLength = 3000
            if (formattedResult.length > maxLength) {
                formattedResult = formattedResult.substring(0, maxLength) + '\n\n... (truncated)'
            }

            const output = `╭━━━━━━━━━━━━━━━━━━━━╮
┃   ⚡ EVAL RESULT     ┃
╰━━━━━━━━━━━━━━━━━━━━╯

*Input:*
\`\`\`${query}\`\`\`

*Output:* (${resultType}) [${executionTime}ms]
\`\`\`${formattedResult}\`\`\`

_⚡ Silva MD Eval Engine_`

            await sock.sendMessage(jid, {
                text: output,
                contextInfo: {
                    mentionedJid: [sender],
                    forwardingScore: 999,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: '120363200367779016@newsletter',
                        newsletterName: 'SILVA MD • EVAL',
                        serverMessageId: Math.floor(Math.random() * 1000)
                    }
                }
            }, { quoted: message })

        } catch (err) {
            await sock.sendMessage(jid, {
                text: `❌ *System Error:* ${err.message}\n\n\`\`\`${err.stack}\`\`\``
            }, { quoted: message })
        }
    }
}

module.exports = { handler }

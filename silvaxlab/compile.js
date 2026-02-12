// Multi-Language Code Compiler Plugin - Silva MD Bot
const config = require('../config')
const axios = require('axios')

const handler = {
    help: ['compile', 'run', 'code'],
    tags: ['tools', 'programming'],
    command: /^(compile|run|code|compile-py|compile-js|compile-java|compile-cpp|compile-c|compile-go|compile-rust|compile-php|compile-rb|compile-swift|compile-kt|compile-ts)$/i,
    group: false,
    admin: false,
    botAdmin: false,
    owner: false,

    execute: async ({ jid, sock, message, args }) => {
        const sender = message.key.participant || message.key.remoteJid

        try {
            // Get the full message text
            const fullText = message.message?.conversation || 
                           message.message?.extendedTextMessage?.text || ''

            // Extract command from the message
            const cmd = fullText.trim().split(' ')[0].replace(config.PREFIX, '')
            const command = cmd.toLowerCase()

            // Check if user wants help
            if (args[0]?.toLowerCase() === 'help' || !fullText.includes(' ')) {
                return sendHelp(sock, jid, message, sender)
            }

            // Extract language and code
            let language = ''
            let code = ''

            // Check if command specifies language (e.g., compile-py, compile-js)
            const cmdMatch = command.match(/^(compile|run|code)-(py|python|js|javascript|java|cpp|c|go|rust|php|rb|swift|kt|ts|node|nodejs)$/)
            
            if (cmdMatch) {
                // Language-specific command
                language = cmdMatch[2]
                code = fullText.replace(new RegExp(`^${config.PREFIX}${command}\\s*`, 'i'), '').trim()
            } else {
                // Generic compile command: .compile <language> <code>
                const parts = fullText.replace(new RegExp(`^${config.PREFIX}${command}\\s*`, 'i'), '').trim()
                const firstSpace = parts.indexOf(' ')
                
                if (firstSpace === -1) {
                    return sendHelp(sock, jid, message, sender)
                }

                language = parts.substring(0, firstSpace).toLowerCase()
                code = parts.substring(firstSpace + 1).trim()
            }

            // Remove code block markers if present
            code = code.replace(/^```[\w]*\n?/, '').replace(/\n?```$/, '').trim()

            if (!code) {
                return sendHelp(sock, jid, message, sender)
            }

            // Send "compiling" message
            await sock.sendMessage(jid, {
                text: `⏳ Compiling ${getLanguageName(language)} code...`,
                contextInfo: createContext(sender, 'SILVA MD • COMPILER')
            }, { quoted: message })

            // Compile and run the code
            const result = await compileCode(language, code)

            // Send result
            await sock.sendMessage(jid, {
                text: result,
                contextInfo: createContext(sender, 'SILVA MD • COMPILER')
            }, { quoted: message })

        } catch (error) {
            console.error('[COMPILER] Error:', error)
            await sock.sendMessage(jid, {
                text: `┏━━━━━━━━━━━━━━━━━━━━┓
┃   ᴄᴏᴍᴘɪʟᴇʀ ᴇʀʀᴏʀ   ┃
┗━━━━━━━━━━━━━━━━━━━━┛

❌ ${error.message}

💡 Use ${config.PREFIX}compile help for usage info`,
                contextInfo: createContext(sender, 'SILVA MD • ERROR')
            }, { quoted: message })
        }
    }
}

// ========================================
// COMPILE CODE USING Piston API (Free & No Auth Required)
// ========================================
async function compileCode(language, code) {
    // Map language aliases to Piston language codes
    const languageMap = {
        // Python
        'py': 'python',
        'python': 'python',
        'python3': 'python',
        'python2': 'python',
        
        // JavaScript
        'js': 'javascript',
        'javascript': 'javascript',
        'node': 'javascript',
        'nodejs': 'javascript',
        
        // TypeScript
        'ts': 'typescript',
        'typescript': 'typescript',
        
        // Java
        'java': 'java',
        
        // C/C++
        'c': 'c',
        'cpp': 'c++',
        'c++': 'c++',
        'csharp': 'csharp',
        'cs': 'csharp',
        
        // Go
        'go': 'go',
        'golang': 'go',
        
        // Rust
        'rust': 'rust',
        'rs': 'rust',
        
        // PHP
        'php': 'php',
        
        // Ruby
        'ruby': 'ruby',
        'rb': 'ruby',
        
        // Swift
        'swift': 'swift',
        
        // Kotlin
        'kotlin': 'kotlin',
        'kt': 'kotlin',
        
        // Others
        'r': 'r',
        'scala': 'scala',
        'perl': 'perl',
        'bash': 'bash',
        'shell': 'bash',
        'sh': 'bash',
    }

    const pistonLanguage = languageMap[language.toLowerCase()]

    if (!pistonLanguage) {
        throw new Error(`Unsupported language: ${language}\n\nSupported: python, js, java, c, cpp, go, rust, php, ruby, swift, kotlin, etc.`)
    }

    try {
        // Using Piston API (Free, no authentication required)
        const response = await axios.post('https://emkc.org/api/v2/piston/execute', {
            language: pistonLanguage,
            version: '*', // Use latest version
            files: [
                {
                    name: getFileName(pistonLanguage),
                    content: code
                }
            ]
        }, {
            headers: {
                'Content-Type': 'application/json'
            },
            timeout: 30000 // 30 second timeout
        })

        const { run } = response.data

        if (run.stderr && run.stderr.trim()) {
            return formatError(language, run.stderr, run.stdout)
        }

        return formatOutput(language, run.stdout, run.code, run.signal)

    } catch (error) {
        if (error.response) {
            const errorMsg = error.response.data?.message || error.response.statusText
            throw new Error(`API Error: ${errorMsg}`)
        } else if (error.code === 'ECONNABORTED') {
            throw new Error('Compilation timeout - code took too long to execute')
        } else {
            throw new Error(`Network error: ${error.message}`)
        }
    }
}

// ========================================
// GET FILE NAME FOR LANGUAGE
// ========================================
function getFileName(language) {
    const fileNames = {
        'python': 'main.py',
        'javascript': 'main.js',
        'typescript': 'main.ts',
        'java': 'Main.java',
        'c': 'main.c',
        'c++': 'main.cpp',
        'csharp': 'Main.cs',
        'go': 'main.go',
        'rust': 'main.rs',
        'php': 'main.php',
        'ruby': 'main.rb',
        'swift': 'main.swift',
        'kotlin': 'Main.kt',
        'r': 'main.r',
        'scala': 'Main.scala',
        'perl': 'main.pl',
        'bash': 'main.sh'
    }

    return fileNames[language] || 'main.txt'
}

// ========================================
// FORMAT OUTPUT
// ========================================
function formatOutput(language, output, exitCode, signal) {
    const langName = getLanguageName(language)
    const status = exitCode === 0 ? '✅ SUCCESS' : '⚠️ WARNING'

    let result = `┏━━━━━━━━━━━━━━━━━━━━┓
┃   ${status.padEnd(18)} ┃
┗━━━━━━━━━━━━━━━━━━━━┛

🔤 Language: ${langName}
📊 Exit Code: ${exitCode}
${signal ? `⚡ Signal: ${signal}` : ''}

📤 OUTPUT:
${'-'.repeat(40)}
${output.trim() || '(no output)'}
${'-'.repeat(40)}`

    return result
}

// ========================================
// FORMAT ERROR
// ========================================
function formatError(language, stderr, stdout) {
    const langName = getLanguageName(language)

    let result = `┏━━━━━━━━━━━━━━━━━━━━┓
┃   ❌ ERROR         ┃
┗━━━━━━━━━━━━━━━━━━━━┛

🔤 Language: ${langName}

📛 ERROR:
${'-'.repeat(40)}
${stderr.trim()}
${'-'.repeat(40)}`

    if (stdout && stdout.trim()) {
        result += `\n\n📤 STDOUT:
${'-'.repeat(40)}
${stdout.trim()}
${'-'.repeat(40)}`
    }

    return result
}

// ========================================
// GET LANGUAGE FULL NAME
// ========================================
function getLanguageName(lang) {
    const names = {
        'py': 'Python',
        'python': 'Python',
        'python3': 'Python 3',
        'python2': 'Python 2',
        'js': 'JavaScript',
        'javascript': 'JavaScript',
        'node': 'Node.js',
        'nodejs': 'Node.js',
        'ts': 'TypeScript',
        'typescript': 'TypeScript',
        'java': 'Java',
        'c': 'C',
        'cpp': 'C++',
        'c++': 'C++',
        'csharp': 'C#',
        'cs': 'C#',
        'go': 'Go',
        'golang': 'Go',
        'rust': 'Rust',
        'rs': 'Rust',
        'php': 'PHP',
        'ruby': 'Ruby',
        'rb': 'Ruby',
        'swift': 'Swift',
        'kotlin': 'Kotlin',
        'kt': 'Kotlin',
        'r': 'R',
        'scala': 'Scala',
        'perl': 'Perl',
        'bash': 'Bash',
        'shell': 'Shell',
        'sh': 'Shell'
    }

    return names[lang.toLowerCase()] || lang.toUpperCase()
}

// ========================================
// SEND HELP MESSAGE
// ========================================
async function sendHelp(sock, jid, message, sender) {
    const helpText = `┏━━━━━━━━━━━━━━━━━━━━┓
┃   ᴄᴏᴅᴇ ᴄᴏᴍᴘɪʟᴇʀ   ┃
┗━━━━━━━━━━━━━━━━━━━━┛

🚀 Compile and run code in multiple languages!

ᴜsᴀɢᴇ ᴍᴇᴛʜᴏᴅ 1:
${config.PREFIX}compile <language> <code>

ᴜsᴀɢᴇ ᴍᴇᴛʜᴏᴅ 2:
${config.PREFIX}compile-<lang> <code>

ᴇxᴀᴍᴘʟᴇs:
• ${config.PREFIX}compile py print("Hello World")
• ${config.PREFIX}compile-py print("Hello")
• ${config.PREFIX}compile js console.log("Hello")
• ${config.PREFIX}compile-js console.log("Test")
• ${config.PREFIX}compile cpp #include <iostream>
using namespace std;
int main() { cout << "Hello"; }

sᴜᴘᴘᴏʀᴛᴇᴅ ʟᴀɴɢᴜᴀɢᴇs:
• Python → py, python
• JavaScript → js, node, nodejs
• TypeScript → ts, typescript
• Java → java
• C → c
• C++ → cpp, c++
• C# → cs, csharp
• Go → go, golang
• Rust → rust, rs
• PHP → php
• Ruby → ruby, rb
• Swift → swift
• Kotlin → kotlin, kt
• R → r
• Scala → scala
• Perl → perl
• Bash → bash, shell, sh

💡 ᴛɪᴘs:
• Enclose multi-line code in triple backticks
• Maximum execution time: 30 seconds
• Powered by Piston API (free & open source)

ᴇxᴀᴍᴘʟᴇ ᴡɪᴛʜ ᴄᴏᴅᴇ ʙʟᴏᴄᴋ:
${config.PREFIX}compile py \`\`\`
def greet(name):
    return f"Hello {name}"
print(greet("World"))
\`\`\``

    return sock.sendMessage(jid, {
        text: helpText,
        contextInfo: createContext(sender, 'SILVA MD • COMPILER')
    }, { quoted: message })
}

// ========================================
// CONTEXT HELPER
// ========================================
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
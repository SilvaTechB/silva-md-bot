process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '1'
import './config.js'

import dotenv from 'dotenv'
import { existsSync, readFileSync, readdirSync, unlinkSync } from 'fs'
import { createRequire } from 'module'
import path, { join } from 'path'
import { platform } from 'process'
import { fileURLToPath, pathToFileURL } from 'url'
import * as ws from 'ws'
import processTxtAndSaveCredentials from './lib/makesession.js'
import clearTmp from './lib/tempclear.js'

// Global path handling utilities
global.__filename = function filename(pathURL = import.meta.url, rmPrefix = platform !== 'win32') {
  return rmPrefix
    ? /file:\/\/\//.test(pathURL)
      ? fileURLToPath(pathURL)
      : pathURL
    : pathToFileURL(pathURL).toString()
}
global.__dirname = function dirname(pathURL) {
  return path.dirname(global.__filename(pathURL, true))
}
global.__require = function require(dir = import.meta.url) {
  return createRequire(dir)
}

// Environment setup
dotenv.config()
global.gurubot = 'https://www.guruapi.tech/api'

// Imports
import chalk from 'chalk'
import { spawn } from 'child_process'
import lodash from 'lodash'
import { Low } from 'lowdb'
import NodeCache from 'node-cache'
import Pino from 'pino'
import yargs from 'yargs'
import CloudDBAdapter from './lib/cloudDBAdapter.js'
import { MongoDB } from './lib/mongoDB.js'
import { makeWASocket, protoType, serialize } from './lib/simple.js'

// Baileys imports
const {
  DisconnectReason,
  useMultiFileAuthState,
  MessageRetryMap,
  makeCacheableSignalKeyStore,
  makeInMemoryStore,
  proto,
  delay,
  jidNormalizedUser,
  PHONENUMBER_MCC,
} = await import('@whiskeysockets/baileys')

// Session initialization
async function initializeSession() {
  const txt = process.env.SESSION_ID
  if (!txt) {
    console.error('❌ SESSION_ID environment variable not found')
    return false
  }

  try {
    await processTxtAndSaveCredentials(txt)
    console.log('✅ Session credentials processed successfully')
    return true
  } catch (error) {
    console.error('❌ Session initialization error:', error)
    return false
  }
}

// Security verification
async function verifySecurity() {
  try {
    const packageJson = JSON.parse(readFileSync('package.json', 'utf8'))
    const authorName = packageJson.author?.name || ''

    if (!authorName) {
      console.log('⚠️ Author information missing in package.json')
      return false
    }

    const expectedAuthor = Buffer.from('Z3VydQ==', 'base64').toString()
    const warningMessage = Buffer.from(
      'Q2hlYXAgQ29weSBPZiBHdXJ1IEJvdCBGb3VuZCwgUGxlYXNlIFVzZSB0aGUgT3JpZ2luYWwgR3VydSBCb3QgRnJvbSBodHRwczovL2dpdGh1Yi5jb20vR3VydTMyMi9HVVJVLUJPVAo=',
      'base64'
    ).toString()

    if (authorName.trim().toLowerCase() !== expectedAuthor.toLowerCase()) {
      console.log(chalk.red(warningMessage))
      return false
    }

    console.log('✅ Security check passed')
    console.log(chalk.bgBlack(chalk.greenBright('🚀 Starting Silva MD bot')))
    return true
  } catch (error) {
    console.error('❌ Security verification error:', error)
    return false
  }
}

// Main execution flow
async function main() {
  console.log('🔧 Initializing Silva MD bot...')
  
  // Initialize session from environment variable
  const sessionInitialized = await initializeSession()
  if (!sessionInitialized) {
    console.error('❌ Aborting due to session initialization failure')
    process.exit(1)
  }
  
  // Add delay for session processing
  await delay(5000)
  
  // Verify security
  const securityPassed = await verifySecurity()
  if (!securityPassed) {
    process.exit(1)
  }

  // Bot configuration
  const pairingCode = !!global.pairingNumber || process.argv.includes('--pairing-code')
  const useQr = process.argv.includes('--qr')
  const useStore = true

  // Logger setup
  const MAIN_LOGGER = Pino({ 
    timestamp: () => `,"time":"${new Date().toJSON()}"`,
    level: process.env.NODE_ENV === 'production' ? 'warn' : 'debug'
  })
  const logger = MAIN_LOGGER.child({})
  logger.level = 'fatal'

  // Session store
  const store = useStore ? makeInMemoryStore({ logger }) : undefined
  store?.readFromFile('./session.json')
  setInterval(() => store?.writeToFile('./session.json'), 300000) // 5 minutes

  const msgRetryCounterCache = new NodeCache()

  // Connection options
  const connectionOptions = {
    version: [2, 3000, 1015901307],
    logger: Pino({ level: 'fatal' }),
    printQRInTerminal: !pairingCode,
    browser: ['Silva MD', 'Chrome', 'Linux'],
    auth: {
      creds: null,
      keys: null
    },
    markOnlineOnConnect: true,
    generateHighQualityLinkPreview: true,
    getMessage: async key => {
      const jid = jidNormalizedUser(key.remoteJid)
      return store?.loadMessage(jid, key.id)?.message || ''
    },
    msgRetryCounterCache,
    syncFullHistory: false
  }

  // Auth state setup
  global.authFolder = `session`
  const { state, saveCreds } = await useMultiFileAuthState(global.authFolder)
  connectionOptions.auth = {
    creds: state.creds,
    keys: makeCacheableSignalKeyStore(state.keys, Pino({ level: 'fatal' }))
  }

  // Create connection
  global.conn = makeWASocket(connectionOptions)
  conn.isInit = false
  store?.bind(conn.ev)

  // Pairing code handling
  if (pairingCode && !conn.authState.creds.registered) {
    let phoneNumber = global.pairingNumber?.replace(/[^0-9]/g, '') || ''

    if (!phoneNumber || !Object.keys(PHONENUMBER_MCC).some(v => phoneNumber.startsWith(v))) {
      console.log(chalk.red("⚠️ Please start with your country's WhatsApp code (e.g., 254xxx)"))
      process.exit(1)
    }

    setTimeout(async () => {
      try {
        const code = await conn.requestPairingCode(phoneNumber)
        const formattedCode = code?.match(/.{1,4}/g)?.join('-') || code
        console.log(chalk.green(`🔑 Your Pairing Code: ${chalk.bold(formattedCode)}`))
      } catch (error) {
        console.error('❌ Pairing code request failed:', error)
      }
    }, 3000)
  }

  console.log('⏳ Waiting for WhatsApp connection...')

  // Database setup
  global.opts = new Object(yargs(process.argv.slice(2)).exitProcess(false).parse())
  global.prefix = new RegExp(
    '^[' + (process.env.PREFIX || '*/i!#$%+£¢€¥^°=¶∆×÷π√✓©®:;?&.\\-.@')
      .replace(/[|\\{}()[\]^$+*?.\-\^]/g, '\\$&') + ']'
  )
  global.opts['db'] = process.env.DATABASE_URL || ''

  global.db = new Low(
    /https?:\/\//.test(opts['db'])
      ? new CloudDBAdapter(opts['db'])
      : /mongodb(\+srv)?:\/\//i.test(opts['db'])
        ? new MongoDB(opts['db'])
        : new JSONFile(`${opts._[0] ? opts._[0] + '_' : ''}database.json`)
  )

  global.DATABASE = global.db

  // Database loader
  global.loadDatabase = async function() {
    if (global.db.READ) {
      return new Promise(resolve => {
        const interval = setInterval(async () => {
          if (!global.db.READ) {
            clearInterval(interval)
            resolve(global.db.data || await global.loadDatabase())
          }
        }, 1000)
      })
    }
    
    if (global.db.data !== null) return global.db.data
    
    global.db.READ = true
    await global.db.read().catch(console.error)
    global.db.READ = null
    global.db.data = {
      users: {},
      chats: {},
      stats: {},
      msgs: {},
      sticker: {},
      settings: {},
      ...(global.db.data || {}),
    }
    return global.db.data
  }

  await loadDatabase()

  // Connection update handler
  async function connectionUpdate(update) {
    const { connection, lastDisconnect, isNewLogin, qr } = update
    global.stopped = connection

    if (isNewLogin) conn.isInit = true

    const code = lastDisconnect?.error?.output?.statusCode || 
                 lastDisconnect?.error?.output?.payload?.statusCode

    if (code && code !== DisconnectReason.loggedOut && conn?.ws.socket == null) {
      console.log('🔄 Attempting to reload handler...')
      try {
        await global.reloadHandler(true)
      } catch (error) {
        console.error('❌ Handler reload failed:', error)
      }
    }

    if (code && (code === DisconnectReason.restartRequired || code === 428)) {
      console.log('🔄 Restart required, resetting...')
      process.send('reset')
    }

    if (global.db.data == null) await loadDatabase()

    if (!pairingCode && useQr && qr !== 0 && qr !== undefined) {
      console.log('🔍 Scan the QR code to login')
    }

    if (connection === 'open') {
      const { jid, name } = conn.user
      const msg = [
        '💖 𝑺𝑰𝑳𝑽𝑨 𝑴𝑫 𝑩𝑶𝑵𝑬 💖',
        `Greetings ${name},`,
        '✅ Successfully deployed *Silva MD Bot*',
        '⚙️ *Prefix:* ' + (process.env.PREFIX || '*/i!#$%+£¢€¥^°=¶∆×÷π√✓©®:;?&.\\-.@'),
        '🏢 *Organization:* Silva Tech Inc.',
        '🗓️ *CREATED:* Sep 2024',
        '🌟 *WhatsApp Channel:* https://whatsapp.com/channel/0029VaAkETLLY6d8qhLmZt2v',
        '🔄 *New features coming soon!*',
        'Developer: Sylivanus Momanyi'
      ].join('\n\n')

      try {
        await conn.sendMessage(jid, { text: msg, mentions: [jid] })
        console.log('✅ Welcome message sent')
      } catch (error) {
        console.error('❌ Failed to send welcome message:', error)
      }

      console.log(chalk.green('\n🚀 Silva MD is operational'))
    }

    if (connection === 'close') {
      console.log(chalk.yellow('\n🔌 Connection closed. Please generate a new session'))
    }
  }

  // Cleanup functions
  function runCleanup() {
    clearTmp()
      .then(() => console.log('🧹 Temporary files cleaned'))
      .catch(err => console.error('❌ Cleanup error:', err))
      .finally(() => setTimeout(runCleanup, 600000)) // 10 minutes
  }

  function clearSessionFiles() {
    try {
      const sessionFiles = readdirSync('./session')
        .filter(file => file.startsWith('pre-key-'))
        .map(file => `./session/${file}`)
      
      sessionFiles.forEach(file => {
        try {
          unlinkSync(file)
          console.log(`🧹 Deleted session file: ${file}`)
        } catch (error) {
          console.error(`❌ Error deleting ${file}:`, error)
        }
      })
    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.error('❌ Session cleanup error:', error)
      }
    }
  }

  // Start cleanup processes
  runCleanup()
  setInterval(clearSessionFiles, 3600000) // 1 hour

  // Handler setup
  process.on('uncaughtException', console.error)
  let handler = await import('./handler.js')

  global.reloadHandler = async function(restartConnection) {
    try {
      const newHandler = await import(`./handler.js?update=${Date.now()}`)
      if (newHandler) handler = newHandler
    } catch (error) {
      console.error('🔄 Handler reload error:', error)
    }

    if (restartConnection) {
      const oldChats = global.conn.chats
      try {
        global.conn.ws.close()
      } catch {}
      conn.ev.removeAllListeners()
      global.conn = makeWASocket({ ...connectionOptions }, { chats: oldChats })
    }

    // Message templates
    conn.welcome = `👋 Hey @user, 🎉 Welcome to @group! Check description: @desc`
    conn.bye = `😢 @user has left! Farewell!`
    conn.spromote = `🆙 @user is now Admin! 🎊`
    conn.sdemote = `🔽 @user is no longer admin`
    conn.sDesc = `📝 Group Description Updated: @desc`
    conn.sSubject = `🖋️ Group Name Changed: @group`
    conn.sIcon = `🖼️ Group Icon Updated!`
    conn.sRevoke = `🔗 New invite link: @revoke`
    conn.sAnnounceOn = `🔒 Group locked (admins only)`
    conn.sAnnounceOff = `🔓 Group unlocked! 🎉`
    conn.sRestrictOn = `🚫 Only admins can edit group info`
    conn.sRestrictOff = `✅ All members can edit group info`
    conn.sDelete = `🗑️ Message Deleted!`

    // Event bindings
    conn.handler = handler.handler.bind(global.conn)
    conn.pollUpdate = handler.pollUpdate.bind(global.conn)
    conn.participantsUpdate = handler.participantsUpdate.bind(global.conn)
    conn.groupsUpdate = handler.groupsUpdate.bind(global.conn)
    conn.onDelete = handler.deleteUpdate.bind(global.conn)
    conn.presenceUpdate = handler.presenceUpdate.bind(global.conn)
    conn.connectionUpdate = connectionUpdate.bind(global.conn)
    conn.credsUpdate = saveCreds.bind(global.conn, true)

    // Event listeners
    conn.ev.on('messages.upsert', conn.handler)
    conn.ev.on('messages.update', conn.pollUpdate)
    conn.ev.on('group-participants.update', conn.participantsUpdate)
    conn.ev.on('groups.update', conn.groupsUpdate)
    conn.ev.on('message.delete', conn.onDelete)
    conn.ev.on('presence.update', conn.presenceUpdate)
    conn.ev.on('connection.update', conn.connectionUpdate)
    conn.ev.on('creds.update', conn.credsUpdate)

    return true
  }

  await global.reloadHandler(false)
  console.log('✅ Event handlers initialized')

  // Plugin loader
  const pluginFolder = global.__dirname(join(__dirname, './SilvaXlab/index'))
  const pluginFilter = filename => /\.js$/.test(filename)
  global.plugins = {}

  async function loadPlugins() {
    const pluginFiles = readdirSync(pluginFolder).filter(pluginFilter)
    console.log(`📦 Loading ${pluginFiles.length} plugins...`)
    
    for (const filename of pluginFiles) {
      try {
        const filePath = global.__filename(join(pluginFolder, filename))
        const module = await import(filePath)
        global.plugins[filename] = module.default || module
      } catch (e) {
        console.error(`❌ Failed to load plugin ${filename}:`, e)
        delete global.plugins[filename]
      }
    }
  }

  await loadPlugins()
  console.log(`✅ ${Object.keys(global.plugins).length} plugins loaded`)

  // Support libraries check
  async function checkSupportLibraries() {
    const tests = await Promise.all([
      testSpawn('ffmpeg', ['-version']),
      testSpawn('ffprobe', ['-version']),
      testSpawn('convert', ['-version']),
      testSpawn('magick', ['-version']),
      testSpawn('gm', ['-version']),
      testSpawn('find', ['--version'])
    ])
    
    const [ffmpeg, ffprobe, convert, magick, gm, find] = tests
    global.support = { ffmpeg, ffprobe, convert, magick, gm, find }
    console.log('🔧 Support libraries:', global.support)
  }

  async function testSpawn(command, args = []) {
    return new Promise(resolve => {
      const proc = spawn(command, args)
      proc.on('close', code => resolve(code === 0))
      proc.on('error', () => resolve(false))
    })
  }

  await checkSupportLibraries()
  console.log('🚀 Silva MD bot is fully operational')
}

// Error handling
process.on('unhandledRejection', (reason) => {
  console.error('⚠️ Unhandled Rejection:', reason)
})

process.on('uncaughtException', (err) => {
  console.error('⚠️ Uncaught Exception:', err)
  process.exit(1)
})

process.on('SIGINT', () => {
  console.log('🚪 Received SIGINT. Shutting down...')
  process.exit(0)
})

// Start the bot
main().catch(err => {
  console.error('❌ Critical error during initialization:', err)
  process.exit(1)
})
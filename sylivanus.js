process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '1'
process.on('uncaughtException', (err) => {
  process.stderr.write(`[UNCAUGHT] ${err.message}\n${err.stack}\n`)
})
process.on('unhandledRejection', (reason) => {
  process.stderr.write(`[UNHANDLED] ${reason?.message || reason}\n`)
})
import './config.js'

import dotenv from 'dotenv'
import { existsSync, readFileSync, readdirSync, unlinkSync, watch } from 'fs'
import { createRequire } from 'module'
import path, { join } from 'path'
import { platform } from 'process'
import { fileURLToPath, pathToFileURL } from 'url'
import * as ws from 'ws'
import qrcodeTerminal from 'qrcode-terminal'
import { loadSession } from './lib/makesession.js'
import clearTmp from './lib/tempclear.js'
import newsletterHandler from './lib/newsletter.js'
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
global.silvabot = 'https://www.guruapi.tech/api'

import chalk from 'chalk'
import { spawn } from 'child_process'
import lodash from 'lodash'
import NodeCache from 'node-cache'
import { default as Pino, default as pino } from 'pino'
import syntaxerror from 'syntax-error'
import { format } from 'util'
import yargs from 'yargs'
import { makeWASocket, protoType, serialize } from './lib/simple.js'

const {
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestWaWebVersion,
  makeCacheableSignalKeyStore,
  proto,
  delay,
  jidNormalizedUser,
} = await import('@whiskeysockets/baileys')

import readline from 'readline'

dotenv.config()

async function main() {
  const txt = process.env.SESSION_ID

  if (!txt) {
    process.stdout.write('No SESSION_ID found. Bot will start in QR code pairing mode.\n')
    process.stdout.write('QR code will be printed in the terminal. Scan it with WhatsApp.\n')
  }

  if (txt) {
    try {
      await loadSession(txt)
      process.stdout.write('Session credentials loaded successfully.\n')
    } catch (error) {
      process.stdout.write(`Error loading session: ${error.message}\n`)
    }
  }
}

main()

await delay(1000 * 5)

async function securityCheck() {
  try {
    const packageJson = readFileSync('package.json', 'utf8')
    const packageData = JSON.parse(packageJson)
    const authorName = packageData.author && packageData.author.name

    if (!authorName) {
      console.log('Author name not found in package.json')
      process.exit(1)
    }

    if (authorName.trim().toLowerCase() !== 'silva') {
      console.log('Unauthorized copy detected. Please use the original Silva MD Bot from https://github.com/SilvaTechB/silva-md-bot')
      process.exit(1)
    } else {
      console.log(chalk.green('Security check passed, Thanks for using Silva MD Bot'))
      console.log(chalk.bgBlack(chalk.redBright('Starting Silva MD Bot...')))
    }
  } catch (error) {
    console.error('Error:', error)
  }
}

securityCheck()

const pairingCode = !!global.pairingNumber || process.argv.includes('--pairing-code')
const useQr = process.argv.includes('--qr')
const useStore = true

const MAIN_LOGGER = pino({ timestamp: () => `,"time":"${new Date().toJSON()}"` })

const logger = MAIN_LOGGER.child({})
logger.level = 'fatal'

const store = undefined

const msgRetryCounterCache = new NodeCache()

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})
const question = text => new Promise(resolve => rl.question(text, resolve))

const { CONNECTING } = ws
const { chain } = lodash
const PORT = process.env.PORT || process.env.SERVER_PORT || 3000

protoType()
serialize()

global.API = (name, path = '/', query = {}, apikeyqueryname) =>
  (name in global.APIs ? global.APIs[name] : name) +
  path +
  (query || apikeyqueryname
    ? '?' +
      new URLSearchParams(
        Object.entries({
          ...query,
          ...(apikeyqueryname
            ? {
                [apikeyqueryname]: global.APIKeys[name in global.APIs ? global.APIs[name] : name],
              }
            : {}),
        })
      )
    : '')
global.timestamp = {
  start: new Date(),
}

const __dirname = global.__dirname(import.meta.url)
global.opts = new Object(yargs(process.argv.slice(2)).exitProcess(false).parse())
global.prefix = new RegExp(
  '^[' +
    (process.env.PREFIX || '*/i!#$%+£¢€¥^°=¶∆×÷π√✓©®:;?&.\\-.@').replace(
      /[|\\{}()[\]^$+*?.\-\^]/g,
      '\\$&'
    ) +
    ']'
)
global.db = {
  data: {
    users: {},
    chats: {},
    stats: {},
    msgs: {},
    sticker: {},
    settings: {},
  },
  chain: null,
  read: async function () {},
  write: async function () {},
}
global.db.chain = chain(global.db.data)

global.DATABASE = global.db

global.loadDatabase = async function loadDatabase() {
  if (global.db.data !== null) return
  global.db.data = {
    users: {},
    chats: {},
    stats: {},
    msgs: {},
    sticker: {},
    settings: {},
  }
  global.db.chain = chain(global.db.data)
}
global.authFolder = `session`
const { state, saveCreds } = await useMultiFileAuthState(global.authFolder)

let { version: waVersion } = await fetchLatestWaWebVersion().catch(() => ({ version: [2, 3000, 1015901307] }))
console.log(chalk.blue(`Using WA version: ${waVersion}`))

const msgRetryCounterMap = {}

const connectionOptions = {
  version: waVersion,
  logger: Pino({
    level: 'silent',
  }),
  browser: ['Ubuntu', 'Chrome', '22.04.4'],
  auth: {
    creds: state.creds,
    keys: makeCacheableSignalKeyStore(
      state.keys,
      Pino().child({
        level: 'fatal',
        stream: 'store',
      })
    ),
  },
  markOnlineOnConnect: true,
  generateHighQualityLinkPreview: false,
  getMessage: async key => {
    let jid = jidNormalizedUser(key.remoteJid)
    let msg = await store?.loadMessage?.(jid, key.id)
    return msg?.message || { conversation: '' }
  },
  msgRetryCounterCache,
  msgRetryCounterMap,
  retryRequestDelayMs: 250,
  maxMsgRetryCount: 10,
  patchMessageBeforeSending: message => {
    const requiresPatch = !!(
      message.buttonsMessage ||
      message.templateMessage ||
      message.listMessage
    )
    if (requiresPatch) {
      message = {
        viewOnceMessage: {
          message: {
            messageContextInfo: {
              deviceListMetadataVersion: 2,
              deviceListMetadata: {},
            },
            ...message,
          },
        },
      }
    }

    return message
  },
  defaultQueryTimeoutMs: undefined,
  syncFullHistory: false,
}

global.conn = makeWASocket(connectionOptions)
conn.isInit = false
store?.bind(conn.ev)

let connectionFailures = 0
const MAX_FAILURES = 5
let hasCompletedFirstConnect = false
let unsubscribeProcess = null
const processedMsgIds = new Set()
let lastMessageTime = Date.now()
let totalMessagesHandled = 0
let connectionOpenTime = 0
const STARTUP_GRACE_MS = 15000
let statusProcessedCount = 0
let lastStatusProcessedTime = 0
const STATUS_RATE_DELAY = 2000

const log = (msg) => process.stdout.write(msg + '\n')

const HANDLER_TIMEOUT = 60000

async function runWithTimeout(fn, timeoutMs, label) {
  return Promise.race([
    fn(),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out after ${timeoutMs}ms`)), timeoutMs)
    )
  ])
}

async function handleMessagesUpsert(upsert) {
  if (!upsert || !upsert.messages || !upsert.messages.length) return

  const msgs = upsert.messages
  const msgType = upsert.type

  for (const msg of msgs) {
    const msgId = msg.key?.id
    if (!msgId) continue
    if (processedMsgIds.has(msgId)) continue
    processedMsgIds.add(msgId)
    if (processedMsgIds.size > 2000) {
      const entries = [...processedMsgIds]
      entries.slice(0, 1500).forEach(id => processedMsgIds.delete(id))
    }

    lastMessageTime = Date.now()
    totalMessagesHandled++

    const from = msg.key?.remoteJid || 'unknown'
    const isFromMe = msg.key?.fromMe || false
    const pushName = msg.pushName || 'Unknown'
    const msgContent = msg.message || {}
    const mtype = Object.keys(msgContent).filter(k => k !== 'messageContextInfo' && k !== 'senderKeyDistributionMessage').join(', ') || 'empty'
    const text = msgContent.conversation || msgContent.extendedTextMessage?.text || msgContent.imageMessage?.caption || msgContent.videoMessage?.caption || ''
    const isGroup = from.endsWith('@g.us')
    const isStatus = from === 'status@broadcast'
    const participant = msg.key?.participant || ''
    const senderDisplay = isGroup ? `${pushName} in ${from.split('@')[0]}` : `${pushName} (${from.split('@')[0]})`

    const isNewsletter = from.endsWith('@newsletter') || from.endsWith('@lid')
    if (isNewsletter) {
      if (text) log(`[NEWSLETTER] ${pushName} (${from.split('@')[0]}): ${mtype} | ${text.slice(0, 60)}`)
    } else if (isStatus) {
      if (mtype !== 'empty') log(`[STATUS] ${pushName} (${participant.split('@')[0] || 'unknown'}): ${mtype}${text ? ' | ' + text.slice(0, 60) : ''}`)
    } else if (mtype === 'reactionMessage') {
      const reaction = msgContent.reactionMessage
      log(`[REACTION] ${senderDisplay}: reacted ${reaction?.text || '?'} to msg ${reaction?.key?.id?.slice(0, 10) || '?'}`)
    } else if (mtype === 'protocolMessage') {
      const proto = msgContent.protocolMessage
      const protoType = proto?.type != null ? proto.type : 'unknown'
      log(`[PROTOCOL] ${senderDisplay}: protocolMessage type=${protoType}`)
    } else if (mtype === 'empty') {
    } else if (isFromMe && !text) {
      log(`[MSG-SELF] ${senderDisplay}: ${mtype} (no text)`)
    } else {
      log(`[MSG] ${senderDisplay}: ${mtype}${text ? ' | ' + text.slice(0, 60) : ''}`)
    }

    const CHANNEL_JID = '120363200367779016@newsletter'
    if (from === CHANNEL_JID && !isFromMe) {
      try {
        await global.conn.sendMessage(from, {
          react: { key: msg.key, text: '🔥' }
        }).catch(() => {})
        log(`[AUTO-REACT] 🔥 Reacted to message in Silva Tech Nexus channel`)
      } catch (e) {
        log(`[AUTO-REACT] Failed to react: ${e.message}`)
      }
    }

    try {
      const isStartupGrace = connectionOpenTime > 0 && (Date.now() - connectionOpenTime) < STARTUP_GRACE_MS
      if (isStatus && !isFromMe) {
        const statusSender = participant?.split('@')[0] || 'unknown'
        if (isStartupGrace) {
          log(`[STATUS] Skipping buffered status from ${pushName} (${statusSender}) during startup grace period`)
        } else {
          const now = Date.now()
          if (now - lastStatusProcessedTime < STATUS_RATE_DELAY) {
            await new Promise(r => setTimeout(r, STATUS_RATE_DELAY))
          }
          lastStatusProcessedTime = Date.now()
          statusProcessedCount++

          if (process.env.statusview === 'true' || process.env.AUTO_STATUS_LIKE === 'true') {
            await global.conn.readMessages([msg.key]).catch(() => {})
            log(`[STATUS] Viewed status from ${pushName} (${statusSender})`)
          }
          if (process.env.AUTO_STATUS_LIKE === 'true') {
            const likeEmoji = process.env.AUTO_STATUS_LIKE_EMOJI || '💚'
            const myJid = global.conn.user?.id ? jidNormalizedUser(global.conn.user.id) : null
            if (myJid) {
              await global.conn.sendMessage('status@broadcast', {
                react: { key: msg.key, text: likeEmoji }
              }, {
                statusJidList: [participant, myJid]
              }).catch(() => {})
              log(`[STATUS] ${likeEmoji} Liked status from ${pushName} (${statusSender})`)
            }
          }
          if (process.env.Status_Saver === 'true') {
            try {
              const ownerJid = global.conn.user?.id ? jidNormalizedUser(global.conn.user.id) : null
              if (ownerJid) {
                await global.conn.copyNForward(ownerJid, msg, true).catch(() => {})
                const caption = msgContent.imageMessage?.caption || msgContent.videoMessage?.caption || ''
                await global.conn.sendMessage(ownerJid, {
                  text: `*AUTO STATUS SAVER*\n*From:* ${pushName}\n*Caption:* ${caption || 'None'}`,
                  mentions: [participant]
                }).catch(() => {})
                log(`[STATUS] Saved status from ${pushName} (${statusSender})`)
              }
            } catch (e) {}
          }
          if (process.env.STATUS_REPLY === 'true') {
            try {
              const replyMsg = process.env.STATUS_MSG || 'SILVA MD SUCCESSFULLY VIEWED YOUR STATUS'
              const quotedStatus = {
                key: { remoteJid: 'status@broadcast', id: msg.key.id, participant },
                message: msg.message
              }
              await global.conn.sendMessage(participant, { text: replyMsg }, { quoted: quotedStatus }).catch(() => {})
              log(`[STATUS] Replied to status from ${pushName}`)
            } catch (e) {}
          }
        }
      }
      if (process.env.autoRead === 'true' && !isStatus) {
        await global.conn.readMessages([msg.key]).catch(() => {})
      }
    } catch (e) {}
  }

  const isStartupGraceForHandler = connectionOpenTime > 0 && (Date.now() - connectionOpenTime) < STARTUP_GRACE_MS
  const hasActualCommand = msgs.some(msg => {
    const mc = msg.message || {}
    const t = mc.conversation || mc.extendedTextMessage?.text || ''
    if (!t) return false
    try {
      if (global.prefix instanceof RegExp) return global.prefix.test(t)
      if (typeof global.prefix === 'string') return t.startsWith(global.prefix)
      return t.startsWith('.')
    } catch { return t.startsWith('.') }
  })

  if (isStartupGraceForHandler && !hasActualCommand) {
    log(`[HANDLER] Skipping ${msgs.length} buffered messages during startup grace period`)
  } else if (global.conn.handler) {
    try {
      await runWithTimeout(
        () => global.conn.handler(upsert),
        HANDLER_TIMEOUT,
        'Message handler'
      )
    } catch (e) {
      if (e.message?.includes('timed out')) {
        log(`[HANDLER-TIMEOUT] Handler took too long, skipping message batch`)
      } else {
        log(`[HANDLER-ERR] ${e.message}\n${e.stack}`)
      }
    }
  } else {
    log(`[WARN] conn.handler is NOT set - messages will not be processed!`)
    if (global.reloadHandler) {
      log(`[WARN] Attempting to rebind handler...`)
      try {
        await global.reloadHandler(false)
        log(`[WARN] Handler rebound successfully`)
      } catch (e) {
        log(`[WARN] Handler rebind failed: ${e.message}`)
      }
    }
  }
}

let emitPatched = false

function registerEventHandlers() {
  const ev = global.conn.ev

  if (unsubscribeProcess) {
    try { unsubscribeProcess() } catch {}
    unsubscribeProcess = null
  }

  if (!emitPatched || !ev._silvaPatched) {
    const originalEmit = ev.emit.bind(ev)
    ev.emit = function(eventName, ...args) {
      if (eventName === 'messages.upsert') {
        const msgCount = args[0]?.messages?.length || 0
        const msgType = args[0]?.type
        if (msgCount > 0) {
          handleMessagesUpsert(args[0]).catch(e => log(`[EMIT-ERR] ${e.message}`))
        }
      }
      return originalEmit(eventName, ...args)
    }
    ev._silvaPatched = true
    emitPatched = true
  }

  unsubscribeProcess = ev.process(async (events) => {
    if (events['connection.update']) {
      const update = events['connection.update']
      const { qr, connection, lastDisconnect } = update
      if (connection) log(`[CONN] Status: ${connection}`)

      if (qr) {
        log('[QR] New QR code generated - scan with WhatsApp')
        qrcodeTerminal.generate(qr, { small: true }, (qrcode) => {
          log(qrcode)
        })
        try { process.send({ type: 'qr', qr }) } catch (e) {}
      }
      if (connection === 'open') {
        log('WhatsApp connected successfully!')
        connectionFailures = 0
        processedMsgIds.clear()
        connectionOpenTime = Date.now()
        statusProcessedCount = 0
        const { jid, name } = global.conn.user || {}
        const prefix = global.prefix || process.env.PREFIX || '.'
        try { process.send({ type: 'connected', jid: jid || '', name: name || 'Unknown', prefix }) } catch (e) {}
        log(`Logged in as: ${name || 'Unknown'} (${jid || 'N/A'})`)

        if (!global.conn.handler && global.reloadHandler) {
          log('[CONN] Handler not bound, rebinding...')
          try { await global.reloadHandler(false) } catch (e) {
            log(`[CONN] Handler rebind error: ${e.message}`)
          }
        }

        const pluginNames = Object.keys(global.plugins || {})
        log(`[PLUGINS] ${pluginNames.length} plugins loaded`)

        if (!hasCompletedFirstConnect) {
          hasCompletedFirstConnect = true
          const prefix = global.prefix || '.'
          const pluginCount = pluginNames.length
          const mode = process.env.MODE || 'public'
          const botName = process.env.BOTNAME || 'Silva MD Bot'
          const uptime = new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })
          const welcomeMsg = `╭━━━━━━━━━━━━━━━━━╮
┃  *${botName}*  
┃  _Connected Successfully_
╰━━━━━━━━━━━━━━━━━╯

Hey *${name || 'Boss'}*
Your bot is now online and ready.

╭─── *Quick Info* ───
│ *Bot:* ${botName}
│ *Prefix:* [ ${prefix} ]
│ *Plugins:* ${pluginCount} loaded
│ *Mode:* ${mode}
│ *Started:* ${uptime}
╰──────────────────

╭─── *About* ───
│ *Dev:* Sylivanus Momanyi
│ *Org:* Silva Tech Inc.
│ *Since:* Sep 2024
╰──────────────────

*Stay Updated:*
https://whatsapp.com/channel/0029VaAkETLLY6d8qhLmZt2v

> Type *${prefix}menu* to see all commands`
          try {
            await global.conn.sendMessage(jid, { text: welcomeMsg, mentions: [jid] }, { quoted: null })
            log(`[CONN] Welcome message sent to ${jid}`)
          } catch (e) {
            log(`[CONN] Could not send welcome message: ${e.message}`)
          }
          await delay(3000)

          try {
            const myJid = jidNormalizedUser(global.conn.user.id)
            await global.conn.sendMessage(myJid, { text: '.ping' })
          } catch (e) {}

          await delay(3000)
          try {
            newsletterHandler.follow({
              sock: global.conn,
              config: global.config || {},
              logMessage: () => {}
            }).catch(() => {})
          } catch (e) {}
        } else {
          log('[CONN] Reconnected successfully (skipping welcome/newsletters)')
        }
      }
      if (connection === 'close') {
        const code = lastDisconnect?.error?.output?.statusCode
        connectionFailures++
        log(`[CONN] Connection closed. Code: ${code} | Attempt: ${connectionFailures}/${MAX_FAILURES}`)

        if (connectionFailures >= MAX_FAILURES) {
          log('\n╔══════════════════════════════════════════╗')
          log('║  SESSION_ID EXPIRED OR INVALID           ║')
          log('║  Please generate a new SESSION_ID and    ║')
          log('║  update the secret, then restart.        ║')
          log('╚══════════════════════════════════════════╝\n')
          return
        }

        if (code === DisconnectReason.loggedOut) {
          log('[CONN] Session logged out. Clearing session...')
          try {
            const sessionFiles = readdirSync('./session')
            for (const f of sessionFiles) {
              if (f !== 'README.md') try { unlinkSync(`./session/${f}`) } catch {}
            }
          } catch {}
        }

        if (code === DisconnectReason.restartRequired || code === 428) {
          log('[CONN] Restart required. Restarting immediately...')
          try { process.send('reset') } catch {}
        }

        const backoff = code === 440 ? Math.min(connectionFailures * 10000, 60000) : Math.min(connectionFailures * 3000, 15000)
        log(`[CONN] Reconnecting in ${backoff/1000}s...`)
        await delay(backoff)
        emitPatched = false
        try {
          if (global.reloadHandler) {
            await global.reloadHandler(true)
          }
        } catch (error) {
          log(`[CONN] Reconnection error: ${error.message}`)
        }
      }
      if (connection === 'connecting') {
        log('[CONN] Connecting to WhatsApp...')
      }
    }

    if (events['creds.update']) {
      await saveCreds()
    }

    if (events['messages.update']) {
      const updates = events['messages.update']
      if (global.conn.pollUpdate) {
        try { global.conn.pollUpdate(updates) } catch (e) {
          log(`[POLL-ERR] ${e.message}`)
        }
      }
    }
    if (events['group-participants.update']) {
      const update = events['group-participants.update']
      if (global.conn.participantsUpdate) {
        try { global.conn.participantsUpdate(update) } catch (e) {
          log(`[GROUP-ERR] ${e.message}`)
        }
      }
    }
    if (events['groups.update']) {
      const update = events['groups.update']
      if (global.conn.groupsUpdate) {
        try { global.conn.groupsUpdate(update) } catch (e) {
          log(`[GROUP-UPDATE-ERR] ${e.message}`)
        }
      }
    }
    if (events['message.delete']) {
      const update = events['message.delete']
      if (global.conn.onDelete) {
        try { global.conn.onDelete(update) } catch (e) {
          log(`[DELETE-ERR] ${e.message}`)
        }
      }
    }
  })

  log('Event handlers registered (emit intercept + ev.process)')
}
registerEventHandlers()

if (pairingCode && !conn.authState.creds.registered) {
  let phoneNumber
  if (!!global.pairingNumber) {
    phoneNumber = global.pairingNumber.replace(/[^0-9]/g, '')

    if (phoneNumber.length < 7) {
      console.log(
        chalk.bgBlack(chalk.redBright("Start with your country's WhatsApp code, Example : 254xxx"))
      )
      process.exit(0)
    }
  } else {
    phoneNumber = await question(
      chalk.bgBlack(chalk.greenBright(`Please type your WhatsApp number : `))
    )
    phoneNumber = phoneNumber.replace(/[^0-9]/g, '')

    if (phoneNumber.length < 7) {
      console.log(
        chalk.bgBlack(chalk.redBright("Start with your country's WhatsApp code, Example : 254xxx"))
      )

      phoneNumber = await question(
        chalk.bgBlack(chalk.greenBright(`Please type your WhatsApp number : `))
      )
      phoneNumber = phoneNumber.replace(/[^0-9]/g, '')
      rl.close()
    }
  }

  setTimeout(async () => {
    let code = await conn.requestPairingCode(phoneNumber)
    code = code?.match(/.{1,4}/g)?.join('-') || code
    const pairingCode =
      chalk.bold.greenBright('Your Pairing Code:') + ' ' + chalk.bgGreenBright(chalk.black(code))
    console.log(pairingCode)
  }, 3000)
}

conn.logger.info('\nWaiting For Login\n')

if (!opts['test']) {
  if (global.db) {
    setInterval(async () => {
      if (global.db.data) await global.db.write()
      if (opts['autocleartmp'] && (global.support || {}).find)
        (tmp = [os.tmpdir(), 'tmp']),
          tmp.forEach(filename =>
            cp.spawn('find', [filename, '-amin', '3', '-type', 'f', '-delete'])
          )
    }, 30 * 1000)
  }
}

function runCleanup() {
  clearTmp()
    .then(() => {
      console.log('Temporary file cleanup completed.')
    })
    .catch(error => {
      console.error('An error occurred during temporary file cleanup:', error)
    })
    .finally(() => {
      setTimeout(runCleanup, 1000 * 60 * 2)
    })
}

runCleanup()

function clearsession() {
}

if (global.db.data == null) loadDatabase()

let isInit = true
let handler = await import('./handler.js')
global.reloadHandler = async function (restatConn) {
  try {
    const Handler = await import(`./handler.js?update=${Date.now()}`).catch(console.error)
    if (Object.keys(Handler || {}).length) handler = Handler
  } catch (error) {
    console.error
  }
  if (restatConn) {
    const oldChats = global.conn.chats
    try {
      global.conn.ws.close()
    } catch {}
    if (unsubscribeProcess) {
      try { unsubscribeProcess() } catch {}
      unsubscribeProcess = null
    }
    global.conn = makeWASocket(connectionOptions, {
      chats: oldChats,
    })
    registerEventHandlers()
    isInit = true
  }

  conn.welcome = `👋 Hey @user, 🎉 *Welcome to* _@group_! 🔍 Check the group description: @desc 💬 Let's keep the vibes positive! 🚀`
  conn.bye = `😢 *@user has left the building!* 👋 Farewell and best wishes!`
  conn.spromote = `🆙 *Promotion Alert!* 👑 @user is now an *Admin*! Let's gooo! 🎊`
  conn.sdemote = `🔽 *Demotion Notice!* @user is no longer an admin.`
  conn.sDesc = `📝 *Group Description Updated!* 🔍 New Description: @desc`
  conn.sSubject = `🖋️ *Group Name Changed!* 🔔 New Title: _@group_`
  conn.sIcon = `🖼️ *Group Icon Updated!* Check out the fresh new look! 🔥`
  conn.sRevoke = `🔗 *Group Link Reset!* Here's the new invite link: @revoke`
  conn.sAnnounceOn = `🔒 *Group Closed!* Only admins can now send messages.`
  conn.sAnnounceOff = `🔓 *Group Open!* Everyone can now chat freely. 🎉`
  conn.sRestrictOn = `🚫 *Edit Permissions Locked!* Only admins can edit group info now.`
  conn.sRestrictOff = `✅ *Edit Permissions Opened!* All members can now update group info.`
  conn.sDelete = `🗑️ *Message Deleted!* This message has been removed.`

  conn.handler = handler.handler.bind(global.conn)
  conn.pollUpdate = handler.pollUpdate.bind(global.conn)
  conn.participantsUpdate = handler.participantsUpdate.bind(global.conn)
  conn.groupsUpdate = handler.groupsUpdate.bind(global.conn)
  conn.onDelete = handler.deleteUpdate.bind(global.conn)
  conn.presenceUpdate = handler.presenceUpdate.bind(global.conn)
  conn.credsUpdate = saveCreds.bind(global.conn, true)

  isInit = false
  return true
}

const pluginFolder = global.__dirname(join(__dirname, './silvaxlab/index'))
const pluginFilter = filename => /\.js$/.test(filename)
global.plugins = {}
async function filesInit() {
  for (const filename of readdirSync(pluginFolder).filter(pluginFilter)) {
    try {
      const file = global.__filename(join(pluginFolder, filename))
      const module = await import(file)
      global.plugins[filename] = module.default || module
    } catch (e) {
      conn.logger.error(e)
      delete global.plugins[filename]
    }
  }
}
filesInit()
  .then(_ => Object.keys(global.plugins))
  .catch(console.error)

global.reload = async (_ev, filename) => {
  if (pluginFilter(filename)) {
    const dir = global.__filename(join(pluginFolder, filename), true)
    if (filename in global.plugins) {
      if (existsSync(dir)) conn.logger.info(`\nUpdated plugin - '${filename}'`)
      else {
        conn.logger.warn(`\nDeleted plugin - '${filename}'`)
        return delete global.plugins[filename]
      }
    } else conn.logger.info(`\nNew plugin - '${filename}'`)
    const err = syntaxerror(readFileSync(dir), filename, {
      sourceType: 'module',
      allowAwaitOutsideFunction: true,
    })
    if (err) conn.logger.error(`\nSyntax error while loading '${filename}'\n${format(err)}`)
    else {
      try {
        const module = await import(`${global.__filename(dir)}?update=${Date.now()}`)
        global.plugins[filename] = module.default || module
      } catch (e) {
        conn.logger.error(`\nError require plugin '${filename}\n${format(e)}'`)
      } finally {
        global.plugins = Object.fromEntries(
          Object.entries(global.plugins).sort(([a], [b]) => a.localeCompare(b))
        )
      }
    }
  }
}
Object.freeze(global.reload)
watch(pluginFolder, global.reload)
await global.reloadHandler()
async function _quickTest() {
  const check = (cmd, args = []) => new Promise(resolve => {
    const p = spawn(cmd, args)
    p.on('error', () => resolve(false))
    p.on('close', code => resolve(code !== 127))
  })
  const [ffmpeg, ffprobe, convert] = await Promise.all([
    check('ffmpeg', ['-version']),
    check('ffprobe', ['-version']),
    check('convert', ['--version']),
  ])
  global.support = Object.freeze({ ffmpeg, ffprobe, ffmpegWebp: ffmpeg, convert, magick: false, gm: false, find: true })
}

async function saafsafai() {
  if (!global.conn || !global.conn.user) return
  try {
    clearsession()
  } catch {}
}

setInterval(saafsafai, 10 * 60 * 1000)

setInterval(() => {
  const connState = global.conn?.ws?.readyState
  const stateNames = { 0: 'CONNECTING', 1: 'OPEN', 2: 'CLOSING', 3: 'CLOSED' }
  const mem = process.memoryUsage()
  const memMB = Math.round(mem.heapUsed / 1024 / 1024)
  const timeSinceMsg = Math.round((Date.now() - lastMessageTime) / 1000)
  process.stdout.write(`[HEARTBEAT] WS: ${stateNames[connState] || connState} | Mem: ${memMB}MB | Handler: ${!!global.conn?.handler} | Msgs: ${totalMessagesHandled} | LastMsg: ${timeSinceMsg}s ago\n`)

  if (connState === 1 && !global.conn?.handler && global.reloadHandler) {
    log('[WATCHDOG] Handler missing while connected - rebinding...')
    global.reloadHandler(false).catch(e => log(`[WATCHDOG] Rebind failed: ${e.message}`))
  }

  if (mem.heapUsed > 300 * 1024 * 1024) {
    log(`[MEM] High memory: ${memMB}MB - clearing caches`)
    if (global.db?.data?.msgs) global.db.data.msgs = {}
    if (global.db?.data?.sticker) global.db.data.sticker = {}
    processedMsgIds.clear()
    try { if (global.gc) global.gc() } catch {}
  }
}, 60000)

_quickTest().catch(console.error)

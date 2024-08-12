import { watchFile, unwatchFile } from 'fs' 
import chalk from 'chalk'
import { fileURLToPath } from 'url'
import moment from 'moment-timezone' 
import fs from 'fs' 

//OwnerShip
global.owner = [
  [process.env.OWNER_NUMBER || '254743706010', process.env.OWNER_NAME || '𝐒𝐈𝐋𝐕𝐀 𝐌𝐃 𝐁𝐎𝐓', true],
  ['254700143167', '𝐒𝐈𝐋𝐕𝐀 𝐌𝐃', true]
]
global.mods = []
global.prems = []

global.author = process.env.OWNER_NAME || '𝐒𝐈𝐋𝐕𝐀 𝐌𝐃 𝐁𝐎𝐓'
global.botname = process.env.BOT_NAME || '𝐒𝐈𝐋𝐕𝐀 𝐌𝐃 𝐁𝐎𝐓'
global.oname = author
global.bname = botname

//Extra Shortcuts
global.smlink = process.env.SOCIAL_MEDIA_LINK || 'https://github.com/SilvaTechB'
global.gclink = process.env.GROUP_LINK || 'https://chat.whatsapp.com/Jjj2lYrtGHc5WY2rUmC6JD'
global.chlink = process.env.CHANNEL_LINK || 'https://whatsapp.com/channel/0029VaAkETLLY6d8qhLmZt2v'
 
//Apikeys
global.shizokeys = 'shizo'

//Sticker Watermarks
global.packname = process.env.BOT_NAME || '𝐒𝐈𝐋𝐕𝐀 𝐌𝐃 𝐁𝐎𝐓'
global.stkpack = process.env.BOT_NAME || '𝐒𝐈𝐋𝐕𝐀 𝐌𝐃 𝐁𝐎𝐓'
global.stkowner = process.env.OWNER_NAME || '© 𝐒𝐈𝐋𝐕𝐀 𝐌𝐃 𝐁𝐎𝐓'

//Watermark
global.maker = process.env.MAKER || 'Made with 𝐒𝐈𝐋𝐕𝐀 𝐌𝐃 𝐁𝐎𝐓'

//global emojis
global.wait = '*⌛ _𝐒𝐈𝐋𝐕𝐀 𝐌𝐃 𝐁𝐎𝐓..._*\n*▰▰▰▱▱▱▱▱*'
global.rwait = '⌛'
global.dmoji = '🤭'
global.done = '✅'
global.error = '❌' 
global.xmoji = '🔥' 

//management
global.bug = '*!! Sorry 💢 !!*\nSomething went wrong 🌋'
global.stop = '*!! 🎭 Unfortunately 𝐒𝐈𝐋𝐕𝐀 𝐌𝐃 𝐁𝐎𝐓💔 !!*\nBot system is not Responding 🙃'

//TimeLines
global.botdate = `*⫹⫺ Date:*  ${moment.tz('Africa/Nairobi').format('DD/MM/YY')}`
global.bottime = `*⫹⫺ Time:* ${moment.tz('Africa/Nairobi').format('HH:mm:ss')}`

//Hosting Management
global.serverHost = 1
global.getQrWeb = 0
global.renderHost = 0
global.replitHost = 0

global.pairingNumber = "254743706010" //put your bot number here

global.mods = ['254743706010','254700143167']
global.prems = ['254700143167','254743706010']
global.allowed = ['254743706010','254700143167']
global.keysZens = ['c2459db922', '37CC845916', '6fb0eff124']
global.keysxxx = keysZens[Math.floor(keysZens.length * Math.random())]
global.keysxteammm = [
  '29d4b59a4aa687ca',
  '5LTV57azwaid7dXfz5fzJu',
  'cb15ed422c71a2fb',
  '5bd33b276d41d6b4',
  'HIRO',
  'kurrxd09',
  'ebb6251cc00f9c63',
]
global.keysxteam = keysxteammm[Math.floor(keysxteammm.length * Math.random())]
global.keysneoxrrr = ['5VC9rvNx', 'cfALv5']
global.keysneoxr = keysneoxrrr[Math.floor(keysneoxrrr.length * Math.random())]
global.lolkeysapi = ['GataDios']
global.keysZens = ['c2459db922', '37CC845916', '6fb0eff124']
global.keysxxx = keysZens[Math.floor(keysZens.length * Math.random())]
global.keysxteammm = [
  '29d4b59a4aa687ca',
  '5LTV57azwaid7dXfz5fzJu',
  'cb15ed422c71a2fb',
  '5bd33b276d41d6b4',
  'HIRO',
  'kurrxd09',
  'ebb6251cc00f9c63',
]

let file = fileURLToPath(import.meta.url)
watchFile(file, () => {
  unwatchFile(file)
  console.log(chalk.redBright("Update 'config.js'"))
  import(`${file}?update=${Date.now()}`)
})

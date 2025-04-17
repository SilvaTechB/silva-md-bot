import { fileURLToPath } from 'url'
import path from 'path'
import { writeFileSync } from 'fs'
import { BufferJSON } from '@whiskeysockets/baileys'
import PastebinAPI from 'pastebin-js'
let pastebin = new PastebinAPI('EMWTMkQAVfJa9kM-MRUrxd5Oku1U7pgL')

async function processTxtAndSaveCredentials(txt) {
  const __filename = fileURLToPath(import.meta.url)
  const __dirname = path.dirname(__filename)

  const pasteId = txt.replace('Silva~', '')

  let decodedData = await pastebin.getPaste(pasteId)

  try {
    const credsPath = path.join(__dirname, '..', 'session', 'creds.json')
    writeFileSync(credsPath, decodedData.toString())
    console.log('Saved credentials to', credsPath)
  } catch (jsonError) {
    console.error('Error parsing JSON:', jsonError)
  }
}

export default processTxtAndSaveCredentials

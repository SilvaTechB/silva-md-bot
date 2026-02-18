import { readFileSync, writeFileSync, existsSync } from 'fs'

/**
 * @type {import('@whiskeysockets/baileys')}
 */
const { initAuthCreds, BufferJSON, proto } = (await import('@whiskeysockets/baileys')).default

/**
 * @param {import('@whiskeysockets/baileys').WASocket | import('@whiskeysockets/baileys').WALegacySocket}
 */
function bind(conn) {
  if (!conn.chats) conn.chats = {}

  function updateNameToDb(contacts) {
    if (!contacts) return
    try {
      contacts = contacts.contacts || contacts
      for (const contact of contacts) {
        const id = conn.decodeJid(contact.id)
        if (!id || id === 'status@broadcast') continue
        let chats = conn.chats[id]
        if (!chats) chats = conn.chats[id] = { ...contact, id }
        conn.chats[id] = {
          ...chats,
          ...({
            ...contact,
            id,
            ...(id.endsWith('@g.us')
              ? { subject: contact.subject || contact.name || chats.subject || '' }
              : { name: contact.notify || contact.name || chats.name || chats.notify || '' }),
          } || {}),
        }
      }
    } catch (e) {
      console.error(e)
    }
  }

  conn.ev.process(async (events) => {
    if (events['contacts.upsert']) {
      updateNameToDb(events['contacts.upsert'])
    }
    if (events['contacts.update']) {
      updateNameToDb(events['contacts.update'])
    }
    if (events['contacts.set']) {
      updateNameToDb(events['contacts.set'])
    }
    if (events['groups.update']) {
      try {
        const groupsUpdates = events['groups.update']
        updateNameToDb(groupsUpdates)
        for (const update of groupsUpdates) {
          const id = conn.decodeJid(update.id)
          if (!id || id === 'status@broadcast') continue
          const isGroup = id.endsWith('@g.us')
          if (!isGroup) continue
          let chats = conn.chats[id]
          if (!chats) chats = conn.chats[id] = { id }
          chats.isChats = true
          const metadata = await conn.groupMetadata(id).catch(_ => null)
          if (metadata) chats.metadata = metadata
          if (update.subject || metadata?.subject) chats.subject = update.subject || metadata.subject
        }
      } catch (e) {
        console.error(e)
      }
    }
    if (events['chats.set']) {
      try {
        const chatsData = events['chats.set']
        const chatsList = chatsData.chats || chatsData
        if (Array.isArray(chatsList)) {
          for (let { id, name, readOnly } of chatsList) {
            id = conn.decodeJid(id)
            if (!id || id === 'status@broadcast') continue
            const isGroup = id.endsWith('@g.us')
            let chats = conn.chats[id]
            if (!chats) chats = conn.chats[id] = { id }
            chats.isChats = !readOnly
            if (name) chats[isGroup ? 'subject' : 'name'] = name
            if (isGroup) {
              const metadata = await conn.groupMetadata(id).catch(_ => null)
              if (name || metadata?.subject) chats.subject = name || metadata.subject
              if (!metadata) continue
              chats.metadata = metadata
            }
          }
        }
      } catch (e) {
        console.error(e)
      }
    }
    if (events['chats.upsert']) {
      try {
        const chatsUpsert = events['chats.upsert']
        if (Array.isArray(chatsUpsert)) {
          for (const chat of chatsUpsert) {
            const { id, name } = chat
            if (!id || id === 'status@broadcast') continue
            conn.chats[id] = { ...(conn.chats[id] || {}), ...chat, isChats: true }
            const isGroup = id.endsWith('@g.us')
            if (isGroup) conn.insertAllGroup?.().catch(_ => null)
          }
        } else {
          const { id, name } = chatsUpsert
          if (id && id !== 'status@broadcast') {
            conn.chats[id] = { ...(conn.chats[id] || {}), ...chatsUpsert, isChats: true }
            const isGroup = id.endsWith('@g.us')
            if (isGroup) conn.insertAllGroup?.().catch(_ => null)
          }
        }
      } catch (e) {
        console.error(e)
      }
    }
    if (events['group-participants.update']) {
      try {
        const { id, participants, action } = events['group-participants.update']
        if (!id) return
        const decodedId = conn.decodeJid(id)
        if (decodedId === 'status@broadcast') return
        if (!(decodedId in conn.chats)) conn.chats[decodedId] = { id: decodedId }
        let chats = conn.chats[decodedId]
        chats.isChats = true
        const groupMetadata = await conn.groupMetadata(decodedId).catch(_ => null)
        if (!groupMetadata) return
        chats.subject = groupMetadata.subject
        chats.metadata = groupMetadata
      } catch (e) {
        console.error(e)
      }
    }
    if (events['presence.update']) {
      try {
        const { id, presences } = events['presence.update']
        const sender = Object.keys(presences)[0] || id
        const _sender = conn.decodeJid(sender)
        const presence = presences[sender]['lastKnownPresence'] || 'composing'
        let chats = conn.chats[_sender]
        if (!chats) chats = conn.chats[_sender] = { id: sender }
        chats.presences = presence
        if (id.endsWith('@g.us')) {
          let chats = conn.chats[id]
          if (!chats) chats = conn.chats[id] = { id }
        }
      } catch (e) {
        console.error(e)
      }
    }
  })
}

const KEY_MAP = {
  'pre-key': 'preKeys',
  session: 'sessions',
  'sender-key': 'senderKeys',
  'app-state-sync-key': 'appStateSyncKeys',
  'app-state-sync-version': 'appStateVersions',
  'sender-key-memory': 'senderKeyMemory',
}

function useSingleFileAuthState(filename, logger) {
  let creds,
    keys = {},
    saveCount = 0
  const saveState = forceSave => {
    logger?.trace('saving auth state')
    saveCount++
    if (forceSave || saveCount > 5) {
      writeFileSync(
        filename,
        JSON.stringify({ creds, keys }, BufferJSON.replacer, 2)
      )
      saveCount = 0
    }
  }

  if (existsSync(filename)) {
    const result = JSON.parse(readFileSync(filename, { encoding: 'utf-8' }), BufferJSON.reviver)
    creds = result.creds
    keys = result.keys
  } else {
    creds = initAuthCreds()
    keys = {}
  }

  return {
    state: {
      creds,
      keys: {
        get: (type, ids) => {
          const key = KEY_MAP[type]
          return ids.reduce((dict, id) => {
            let value = keys[key]?.[id]
            if (value) {
              if (type === 'app-state-sync-key') {
                value = proto.AppStateSyncKeyData.fromObject(value)
              }
              dict[id] = value
            }
            return dict
          }, {})
        },
        set: data => {
          for (const _key in data) {
            const key = KEY_MAP[_key]
            keys[key] = keys[key] || {}
            Object.assign(keys[key], data[_key])
          }
          saveState()
        },
      },
    },
    saveState,
  }
}
export default {
  bind,
  useSingleFileAuthState,
}

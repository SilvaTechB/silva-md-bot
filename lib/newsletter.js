import baileys from '@whiskeysockets/baileys'
const { newsletterFollow } = baileys.default || baileys

class NewsletterHandler {
  async follow({ sock, config, logMessage }) {
    const newsletterIds = config?.NEWSLETTER_IDS || [
      '120363276154401733@newsletter',
      '120363200367779016@newsletter',
      '120363199904258143@newsletter',
      '120363422731708290@newsletter'
    ]

    for (const jid of newsletterIds) {
      try {
        if (typeof sock.newsletterFollow === 'function') {
          await sock.newsletterFollow(jid)
          logMessage?.('SUCCESS', `✅ Followed newsletter ${jid}`)
        } else if (typeof newsletterFollow === 'function') {
          await newsletterFollow(sock, jid)
          logMessage?.('SUCCESS', `✅ Followed newsletter ${jid}`)
        } else {
          logMessage?.('DEBUG', 'newsletterFollow not supported in this version')
          break
        }
      } catch (err) {
        logMessage?.('ERROR', `Failed to follow newsletter ${jid}: ${err.message}`)
      }
    }
  }
}

export default new NewsletterHandler()

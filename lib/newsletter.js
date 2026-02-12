// lib/newsletter.js
const { newsletterFollow } = require('@whiskeysockets/baileys');

class NewsletterHandler {
    async follow({ sock, config, logMessage }) {
        const newsletterIds = config?.NEWSLETTER_IDS || [
            '120363276154401733@newsletter',
            '120363200367779016@newsletter',
            '120363199904258143@newsletter',
            '120363422731708290@newsletter'
        ];

        for (const jid of newsletterIds) {
            try {
                // Check if the method exists
                if (typeof sock.newsletterFollow === 'function') {
                    await sock.newsletterFollow(jid);
                    logMessage?.('SUCCESS', `✅ Followed newsletter ${jid}`);
                } else if (typeof newsletterFollow === 'function') {
                    // Try using the imported function directly
                    await newsletterFollow(sock, jid);
                    logMessage?.('SUCCESS', `✅ Followed newsletter ${jid}`);
                } else {
                    logMessage?.('DEBUG', 'newsletterFollow not supported in this version');
                    break;
                }
            } catch (err) {
                logMessage?.('ERROR', `Failed to follow newsletter ${jid}: ${err.message}`);
            }
        }
    }
}

module.exports = new NewsletterHandler();

// lib/safeSend.js
async function safeSendMessage(sock, originalSendMessage, jid, content, options = {}) {
    try {
        await originalSendMessage(jid, content, options);
    } catch (error) {
        if (error.message && error.message.includes("No sessions")) {
            console.warn(`⚠️ No session found for ${jid}, initializing sender key...`);
            try {
                // ✅ Join group encryption keys
                if (jid.endsWith('@g.us')) {
                    await sock.groupMetadata(jid); // Fetch group info
                    await sock.sendPresenceUpdate('composing', jid);
                    await new Promise(resolve => setTimeout(resolve, 2000));
                }

                // ✅ Retry after short wait
                await originalSendMessage(jid, content, options);
                console.log(`✅ Message sent after initializing session: ${jid}`);
            } catch (retryError) {
                console.error(`❌ Retry failed for ${jid}:`, retryError.message);
            }
        } else if (error.message.includes('not-acceptable')) {
            console.error(`❌ Cannot send message to ${jid}. The bot may not be allowed or encryption failed.`);
        } else {
            console.error(`❌ sendMessage Error for ${jid}:`, error.message);
        }
    }
}

module.exports = safeSendMessage;

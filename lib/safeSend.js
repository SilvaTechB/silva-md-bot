// lib/safeSend.js
async function safeSendMessage(sock, jid, content, options = {}) {
    try {
        await sock.sendMessage(jid, content, options);
    } catch (error) {
        if (error.message && error.message.includes("No sessions")) {
            console.warn(`⚠️ No session found for ${jid}, retrying...`);
            try {
                // Force presence update and wait before retry
                await sock.presenceSubscribe(jid);
                await sock.sendPresenceUpdate('composing', jid);
                await new Promise(resolve => setTimeout(resolve, 1500));

                // Retry sending message
                await sock.sendMessage(jid, content, options);
                console.log(`✅ Message sent after session init: ${jid}`);
            } catch (retryError) {
                console.error(`❌ Retry failed for ${jid}:`, retryError.message);
            }
        } else {
            console.error(`❌ sendMessage Error for ${jid}:`, error.message);
        }
    }
}

module.exports = safeSendMessage;

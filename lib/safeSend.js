// lib/safeSend.js
const delay = ms => new Promise(res => setTimeout(res, ms));

async function safeSendMessage(sock, originalSendMessage, jid, content, options = {}) {
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
        try {
            await originalSendMessage(jid, content, options);
            return console.log(`✅ Message sent to ${jid}`);
        } catch (error) {
            attempts++;
            if (error.message.includes("No sessions")) {
                console.warn(`⚠️ No session for ${jid}, attempt ${attempts}/${maxAttempts}. Initializing sender key...`);
                try {
                    if (jid.endsWith('@g.us')) {
                        await sock.groupMetadata(jid); // fetch group info
                        await sock.sendMessage(jid, { text: '' }); // trigger key distribution
                        await delay(2000); // wait before retry
                    }
                } catch (metaError) {
                    console.error(`❌ Failed to initialize group session for ${jid}:`, metaError.message);
                }
            } else {
                console.error(`❌ sendMessage Error for ${jid}:`, error.message);
                break;
            }
        }
    }

    console.error(`❌ Giving up after ${maxAttempts} attempts for ${jid}`);
}

module.exports = safeSendMessage;

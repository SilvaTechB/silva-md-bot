// lib/safeSend.js
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

module.exports = async function safeSend(sock, originalSendMessage, jid, content, options = {}) {
    try {
        return await originalSendMessage(jid, content, options);
    } catch (error) {
        if (error.message.includes('No session for') && jid.endsWith('@g.us')) {
            console.log(`⚠️ Session error for ${jid}, requesting sender key...`);
            
            // Request sender key distribution
            await sock.sendMessage(jid, {
                protocolMessage: {
                    senderKeyDistributionMessage: {
                        groupId: jid
                    }
                }
            });
            
            // Wait for key propagation
            await delay(2000);
            
            // Retry after key distribution
            return await originalSendMessage(jid, content, options);
        }
        
        // Handle other common errors
        if (error.message.includes('Message timed out')) {
            console.log(`⚠️ Retrying timed out message to ${jid}`);
            await delay(1000);
            return await originalSendMessage(jid, content, options);
        }
        
        throw error;
    }
};

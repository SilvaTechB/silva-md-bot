// lib/safeSend.js
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

module.exports = async function safeSend(sock, originalSendMessage, jid, content, options = {}) {
    try {
        // Log outgoing message
        let contentInfo = '';
        if (content.text) contentInfo = `Text: ${content.text.substring(0, 50)}...`;
        else if (content.image) contentInfo = 'Image Message';
        else if (content.video) contentInfo = 'Video Message';
        else if (content.document) contentInfo = 'Document Message';
        else contentInfo = 'Complex Message';
        
        console.log(`📤 Sending to ${jid}: ${contentInfo}`);
        
        return await originalSendMessage(jid, content, options);
    } catch (error) {
        console.error(`❌ Send Error to ${jid}:`, error.message);
        
        // Handle group session errors
        if (error.message.includes('No session for') && jid.endsWith('@g.us')) {
            console.log(`⚠️ Session error for ${jid}, requesting sender key...`);
            
            try {
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
            } catch (innerErr) {
                console.error('❌ Session recovery failed:', innerErr);
                // Final fallback attempt
                await delay(1000);
                return await originalSendMessage(jid, content, options);
            }
        }
        
        // Handle other common errors
        if (error.message.includes('Message timed out') || 
            error.message.includes('Socket closed') ||
            error.message.includes('Connection closed')) {
            console.log(`⚠️ Retrying message to ${jid}`);
            await delay(1000);
            return await originalSendMessage(jid, content, options);
        }
        
        throw error;
    }
};

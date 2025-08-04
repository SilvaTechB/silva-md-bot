// lib/safeSend.js
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

module.exports = async function safeSend(sock, originalSendMessage, jid, content, options = {}) {
    const maxRetries = 3;
    let attempt = 0;
    
    while (attempt < maxRetries) {
        try {
            // Log outgoing message
            let contentInfo = '';
            if (content.text) contentInfo = `Text: ${content.text.substring(0, 50)}...`;
            else if (content.image) contentInfo = 'Image Message';
            else if (content.video) contentInfo = 'Video Message';
            else if (content.document) contentInfo = 'Document Message';
            else contentInfo = 'Complex Message';
            
            console.log(`📤 Sending to ${jid}: ${contentInfo} (Attempt ${attempt+1}/${maxRetries})`);
            
            return await originalSendMessage(jid, content, options);
        } catch (error) {
            attempt++;
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
                    
                    continue; // Retry after key distribution
                } catch (innerErr) {
                    console.error('❌ Session recovery failed:', innerErr);
                }
            }
            
            // Handle other common errors
            if (error.message.includes('Message timed out') || 
                error.message.includes('Socket closed') ||
                error.message.includes('Connection closed')) {
                console.log(`⚠️ Retrying message to ${jid}`);
                await delay(1000);
                continue;
            }
            
            throw error;
        }
    }
    
    throw new Error(`Failed to send message after ${maxRetries} attempts`);
};

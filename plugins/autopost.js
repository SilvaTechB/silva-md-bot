module.exports = {
    name: 'autopost',
    commands: ['autopost'],
    handler: async ({ sock, m, sender }) => {
        try {
            if (sender !== `${config.OWNER_NUMBER}@s.whatsapp.net`) {
                return sock.sendMessage(sender, { 
                    text: '❌ Only the owner can use this command!' 
                }, { quoted: m });
            }
            
            // Get the last 5 minutes of messages
            const messages = await sock.loadMessages(sender, 5);
            
            // Filter messages from owner
            const ownerMessages = messages.filter(msg => 
                msg.key.fromMe && 
                (Date.now() - msg.messageTimestamp * 1000) < 300000
            );
            
            if (ownerMessages.length === 0) {
                return sock.sendMessage(sender, { 
                    text: '❌ No recent messages found to post' 
                }, { quoted: m });
            }
            
            // Post each message to newsletters
            for (const msg of ownerMessages) {
                const content = msg.message;
                const newsletters = ['120363200367779016@newsletter']; // Add your newsletter JIDs
                
                for (const nl of newsletters) {
                    await sock.sendMessage(nl, content);
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }
            
            return sock.sendMessage(sender, { 
                text: `✅ Posted ${ownerMessages.length} messages to newsletters!` 
            }, { quoted: m });
        } catch (err) {
            console.error('AutoPost plugin error:', err);
            sock.sendMessage(sender, { 
                text: '❌ Failed to auto-post messages' 
            }, { quoted: m });
        }
    }
};

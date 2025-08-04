module.exports = {
    name: 'newsletter',
    commands: ['nlcreate', 'nlsub', 'nlunsub'],
    handler: async ({ sock, m, sender, args, command }) => {
        try {
            if (command === 'nlcreate') {
                if (sender !== `${config.OWNER_NUMBER}@s.whatsapp.net`) {
                    return sock.sendMessage(sender, { 
                        text: '❌ Only the owner can create newsletters!' 
                    }, { quoted: m });
                }
                
                const name = args[0] || 'Silva Newsletter';
                await sock.createNewsletter(name, {
                    // Optional settings
                });
                
                return sock.sendMessage(sender, { 
                    text: `✅ Newsletter "${name}" created!` 
                }, { quoted: m });
            }
            
            if (command === 'nlsub') {
                const newsletterJid = args[0];
                if (!newsletterJid) return sock.sendMessage(sender, { 
                    text: 'Please provide newsletter JID' 
                }, { quoted: m });
                
                await sock.subscribeToNewsletter(newsletterJid);
                return sock.sendMessage(sender, { 
                    text: `✅ Subscribed to newsletter!` 
                }, { quoted: m });
            }
            
            if (command === 'nlunsub') {
                const newsletterJid = args[0];
                if (!newsletterJid) return sock.sendMessage(sender, { 
                    text: 'Please provide newsletter JID' 
                }, { quoted: m });
                
                await sock.leaveNewsletter(newsletterJid);
                return sock.sendMessage(sender, { 
                    text: `✅ Unsubscribed from newsletter!` 
                }, { quoted: m });
            }
        } catch (err) {
            console.error('Newsletter plugin error:', err);
            sock.sendMessage(sender, { 
                text: '❌ Newsletter operation failed. Please try again.' 
            }, { quoted: m });
        }
    }
};

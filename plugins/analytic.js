module.exports = {
    name: 'analytics',
    commands: ['nlastats'],
    handler: async ({ sock, m, sender }) => {
        try {
            if (sender !== `${config.OWNER_NUMBER}@s.whatsapp.net`) {
                return sock.sendMessage(sender, { 
                    text: '❌ Only the owner can view analytics!' 
                }, { quoted: m });
            }
            
            const newsletterJid = '120363200367779016@newsletter';
            const metadata = await sock.getNewsletterMetadata(newsletterJid);
            
            const stats = `📊 *Newsletter Analytics*\n\n` +
                `📰 Name: ${metadata.name}\n` +
                `👥 Subscribers: ${metadata.subscribers}\n` +
                `📈 Views: ${metadata.views}\n` +
                `🔄 Last Updated: ${new Date(metadata.updateTime * 1000).toLocaleString()}\n\n` +
                `🔗 Link: https://whatsapp.com/channel/${newsletterJid.split('@')[0]}`;
            
            await sock.sendMessage(sender, { 
                text: stats,
                contextInfo: globalContextInfo
            }, { quoted: m });
        } catch (err) {
            console.error('Analytics plugin error:', err);
            sock.sendMessage(sender, { 
                text: '❌ Failed to get newsletter stats' 
            }, { quoted: m });
        }
    }
};

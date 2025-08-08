module.exports = {
    name: 'blocklist',
    commands: ['blocklist', 'listblock'],
    tags: ['main'],
    description: 'Show list of blocked numbers',
    handler: async ({ sock, m, sender, contextInfo }) => {
        try {
            // Fetch blocklist
            const blocklist = await sock.fetchBlocklist();
            
            if (!blocklist || blocklist.length === 0) {
                return sock.sendMessage(
                    sender,
                    { 
                        text: '🔓 *No numbers are currently blocked*',
                        contextInfo: contextInfo
                    },
                    { quoted: m }
                );
            }

            // Format the list
            let txt = `🚫 *Blocked Numbers List*\n\n• Total Blocked: ${blocklist.length}\n\n┌───⊷\n`;
            const mentions = [];
            
            for (const number of blocklist) {
                const num = number.split('@')[0];
                txt += `▢ @${num}\n`;
                mentions.push(num + '@s.whatsapp.net');
            }
            txt += '└───────────';

            // Send the formatted list
            await sock.sendMessage(
                sender,
                { 
                    text: txt,
                    mentions: mentions,
                    contextInfo: {
                        ...contextInfo,
                        externalAdReply: {
                            title: "Silva MD Blocklist",
                            body: "Manage blocked contacts",
                            thumbnailUrl: "https://files.catbox.moe/5uli5p.jpeg",
                            mediaType: 1
                        }
                    }
                },
                { quoted: m }
            );

        } catch (error) {
            console.error('Blocklist Error:', error);
            await sock.sendMessage(
                sender,
                { 
                    text: '❌ *Failed to fetch blocklist*\n' + (error.message || 'Try again later'),
                    contextInfo: contextInfo
                },
                { quoted: m }
            );
        }
    }
};

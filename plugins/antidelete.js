const { getContentType } = require('@whiskeysockets/baileys');

module.exports = {
    name: 'antidelete',
    commands: ['antidelete'],
    desc: 'Detects and shows deleted messages',
    handler: async ({ sock, m, store }) => {
        // No direct command needed - works automatically
    },
    events: {
        'messages.delete': async ({ sock, store, key }) => {
            try {
                const msg = store.loadMessage(key.remoteJid, key.id);
                if (!msg) return;

                const sender = msg.key.participant || msg.key.remoteJid;
                const user = await sock.getName(sender);
                const msgType = getContentType(msg.message);
                
                let deletedContent = '🚫 *Deleted Message Detected* 🚫\n\n';
                deletedContent += `• *Sender*: @${sender.split('@')[0]}\n`;
                deletedContent += `• *Time*: ${new Date(msg.messageTimestamp * 1000).toLocaleString()}\n\n`;

                if (msgType === 'conversation') {
                    deletedContent += `*Text*: ${msg.message.conversation}`;
                } 
                else if (msgType === 'extendedTextMessage') {
                    deletedContent += `*Text*: ${msg.message.extendedTextMessage.text}`;
                }
                else if (msgType === 'imageMessage') {
                    deletedContent += '*Content*: [Deleted Image]';
                    if (msg.message.imageMessage.caption) {
                        deletedContent += `\n*Caption*: ${msg.message.imageMessage.caption}`;
                    }
                }
                else if (msgType === 'videoMessage') {
                    deletedContent += '*Content*: [Deleted Video]';
                    if (msg.message.videoMessage.caption) {
                        deletedContent += `\n*Caption*: ${msg.message.videoMessage.caption}`;
                    }
                }
                else {
                    deletedContent += `*Content*: [Deleted ${msgType.replace('Message', '')}]`;
                }

                await sock.sendMessage(key.remoteJid, { 
                    text: deletedContent,
                    mentions: [sender]
                });

            } catch (error) {
                console.error('AntiDelete Error:', error);
            }
        }
    }
};

const { Sticker, createSticker, StickerTypes } = require('wa-sticker-formatter');

module.exports = {
    name: 'sticker',
    commands: ['sticker', 's'],
    handler: async ({ sock, m, sender }) => {
        try {
            // Check if message has media
            if (!m.message.imageMessage && !m.message.videoMessage) {
                return sock.sendMessage(sender, { 
                    text: 'Please send an image or video with caption .sticker' 
                }, { quoted: m });
            }

            // Download media
            const mediaType = m.message.imageMessage ? 'image' : 'video';
            const buffer = await sock.downloadMediaMessage(m);
            
            // Create sticker
            const sticker = await createSticker(buffer, {
                pack: config.BOT_NAME,
                author: 'Silva MD',
                type: mediaType === 'image' ? StickerTypes.FULL : StickerTypes.CROPPED,
                categories: ['🤩', '🎉'],
                quality: 50,
                background: '#00000000' // Transparent background
            });

            // Send sticker
            await sock.sendMessage(sender, sticker, { quoted: m });
        } catch (err) {
            console.error('Sticker plugin error:', err);
            sock.sendMessage(sender, { 
                text: '❌ Failed to create sticker. Please try again.' 
            }, { quoted: m });
        }
    }
};

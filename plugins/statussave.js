module.exports = {
    name: 'status-saver',
    commands: ['send', 'nitumie', 'save'],
    tags: ['status', 'utility'],
    description: 'Download statuses by replying with keywords',
    handler: async ({ sock, m, sender, contextInfo }) => {
        try {
            // Check if sock is available
            if (!sock || typeof sock.sendMessage !== 'function') {
                console.error('WebSocket connection (sock) is not available');
                return;
            }

            // Define trigger keywords
            const keywords = ['send', 'nitumie', 'save'];

            // Ensure this is a reply to a status message
            if (!m.quoted || !m.quoted.message || 
               (!m.quoted.message.imageMessage && !m.quoted.message.videoMessage)) {
                return await sock.sendMessage(
                    sender,
                    { 
                        text: '*⚠️ Please reply to a status message (image/video) with one of these keywords:*\n' + 
                              keywords.map(k => `• ${k}`).join('\n'),
                        contextInfo: contextInfo
                    },
                    { quoted: m }
                );
            }

            // Check if message contains trigger keyword
            const text = (m.text || '').toLowerCase();
            if (!keywords.some(keyword => text.includes(keyword))) return;

            // Extract media from quoted message
            const mediaMessage = m.quoted.message.imageMessage || m.quoted.message.videoMessage;
            const caption = mediaMessage.caption || "*Status downloaded by Silva MD*";

            // Download the media
            const buffer = await sock.downloadMediaMessage(m.quoted);
            if (!buffer) {
                throw new Error('Failed to download media');
            }

            // Determine media type
            const isImage = !!m.quoted.message.imageMessage;
            const mediaType = isImage ? 'image' : 'video';

            // Send back to user
            await sock.sendMessage(
                sender,
                {
                    [mediaType]: buffer,
                    caption: caption,
                    contextInfo: {
                        ...contextInfo,
                        externalAdReply: {
                            title: "Status Saved",
                            body: "Silva MD Status Downloader",
                            thumbnailUrl: "https://files.catbox.moe/5uli5p.jpeg",
                            mediaType: 1
                        }
                    }
                },
                { quoted: m }
            );

        } catch (error) {
            console.error('Status Saver Error:', error);
            if (sock && typeof sock.sendMessage === 'function') {
                await sock.sendMessage(
                    sender,
                    { 
                        text: '❌ *Failed to download status!*\nPlease try again later',
                        contextInfo: contextInfo
                    },
                    { quoted: m }
                );
            }
        }
    }
};
